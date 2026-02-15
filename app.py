import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, render_template, request

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "podwave_mobile.sqlite3"

app = Flask(__name__)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_db() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with get_db() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS mobile_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                dni TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS channels (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT DEFAULT '',
                cover_emoji TEXT DEFAULT '🎧',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS episodes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                channel_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                duration_min INTEGER DEFAULT 10,
                mood TEXT DEFAULT 'Focus',
                created_at TEXT NOT NULL,
                FOREIGN KEY(channel_id) REFERENCES channels(id)
            );

            CREATE TABLE IF NOT EXISTS app_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                started_at TEXT NOT NULL,
                ended_at TEXT,
                screens_visited INTEGER DEFAULT 0,
                plays_count INTEGER DEFAULT 0,
                favorites_count INTEGER DEFAULT 0,
                FOREIGN KEY(user_id) REFERENCES mobile_users(id)
            );

            CREATE TABLE IF NOT EXISTS user_favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                episode_id INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE(user_id, episode_id),
                FOREIGN KEY(user_id) REFERENCES mobile_users(id),
                FOREIGN KEY(episode_id) REFERENCES episodes(id)
            );

            CREATE TABLE IF NOT EXISTS app_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                event_type TEXT NOT NULL,
                episode_id INTEGER,
                screen_name TEXT,
                payload_json TEXT DEFAULT '{}',
                created_at TEXT NOT NULL,
                FOREIGN KEY(session_id) REFERENCES app_sessions(id)
            );
            """
        )


def seed_data() -> None:
    with get_db() as connection:
        has_channels = connection.execute("SELECT COUNT(*) AS n FROM channels").fetchone()["n"]
        if has_channels:
            return

        channels = [
            ("Flow Diario", "Productividad", "Rutinas y hábitos para DAM.", "⚡"),
            ("Pixel Talks", "Tecnología", "Tendencias de desarrollo móvil.", "📱"),
            ("Mind Garden", "Bienestar", "Respira, enfoca y programa mejor.", "🌿"),
        ]
        connection.executemany(
            """
            INSERT INTO channels (name, category, description, cover_emoji, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            [(name, category, desc, emoji, now_iso()) for name, category, desc, emoji in channels],
        )

        channel_rows = connection.execute("SELECT id, name FROM channels ORDER BY id").fetchall()
        channel_map = {row["name"]: row["id"] for row in channel_rows}

        episodes = [
            (channel_map["Flow Diario"], "Bloques de estudio de 25 min", 18, "Focus"),
            (channel_map["Flow Diario"], "Checklist anti procrastinación", 14, "Focus"),
            (channel_map["Pixel Talks"], "Arquitectura mobile-first", 22, "Build"),
            (channel_map["Pixel Talks"], "UI motion y transiciones", 19, "Build"),
            (channel_map["Mind Garden"], "Respiración para exámenes", 12, "Calm"),
            (channel_map["Mind Garden"], "Deep work y descanso activo", 16, "Calm"),
        ]
        connection.executemany(
            """
            INSERT INTO episodes (channel_id, title, duration_min, mood, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            [(channel_id, title, dur, mood, now_iso()) for channel_id, title, dur, mood in episodes],
        )


@app.get("/")
def home():
    return render_template("index.html")


@app.post("/api/users/register")
def register_user():
    body = request.get_json(silent=True) or {}
    name = str(body.get("name", "")).strip()
    dni = str(body.get("dni", "")).strip().upper()

    if not name or not dni:
        return jsonify({"ok": False, "error": "Nombre y DNI son obligatorios."}), 400

    with get_db() as connection:
        user_id = connection.execute(
            "INSERT INTO mobile_users (name, dni, created_at) VALUES (?, ?, ?)",
            (name, dni, now_iso()),
        ).lastrowid

    return jsonify({"ok": True, "userId": user_id, "name": name, "dni": dni})


@app.post("/api/sessions/start")
def start_session():
    body = request.get_json(silent=True) or {}
    user_id = body.get("userId")

    if not user_id:
        return jsonify({"ok": False, "error": "userId es obligatorio."}), 400

    with get_db() as connection:
        session_id = connection.execute(
            "INSERT INTO app_sessions (user_id, started_at) VALUES (?, ?)",
            (user_id, now_iso()),
        ).lastrowid

    return jsonify({"ok": True, "sessionId": session_id})


@app.post("/api/sessions/end")
def end_session():
    body = request.get_json(silent=True)
    if body is None:
        raw = request.get_data(as_text=True) or "{}"
        try:
            body = json.loads(raw)
        except json.JSONDecodeError:
            body = {}

    session_id = body.get("sessionId")
    screens_visited = int(body.get("screensVisited", 0) or 0)
    plays_count = int(body.get("playsCount", 0) or 0)
    favorites_count = int(body.get("favoritesCount", 0) or 0)

    if not session_id:
        return jsonify({"ok": False, "error": "sessionId es obligatorio."}), 400

    with get_db() as connection:
        connection.execute(
            """
            UPDATE app_sessions
            SET ended_at = ?, screens_visited = ?, plays_count = ?, favorites_count = ?
            WHERE id = ?
            """,
            (now_iso(), screens_visited, plays_count, favorites_count, session_id),
        )

    return jsonify({"ok": True})


@app.post("/api/events")
def log_event():
    body = request.get_json(silent=True) or {}
    session_id = body.get("sessionId")
    event_type = str(body.get("eventType", "")).strip()
    episode_id = body.get("episodeId")
    screen_name = str(body.get("screenName", "")).strip() or None
    payload = body.get("payload", {})

    if not session_id or not event_type:
        return jsonify({"ok": False, "error": "sessionId y eventType obligatorios."}), 400

    with get_db() as connection:
        connection.execute(
            """
            INSERT INTO app_events (session_id, event_type, episode_id, screen_name, payload_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (session_id, event_type, episode_id, screen_name, json.dumps(payload, ensure_ascii=False), now_iso()),
        )

    return jsonify({"ok": True})


@app.get("/api/channels")
def list_channels():
    with get_db() as connection:
        rows = connection.execute("SELECT * FROM channels ORDER BY id").fetchall()
    return jsonify({"ok": True, "channels": [dict(row) for row in rows]})


@app.get("/api/episodes")
def list_episodes():
    mood = request.args.get("mood")
    query = """
        SELECT e.id, e.channel_id, e.title, e.duration_min, e.mood,
               c.name AS channel_name, c.cover_emoji
        FROM episodes e
        JOIN channels c ON c.id = e.channel_id
    """
    params: list[str] = []
    if mood:
        query += " WHERE e.mood = ?"
        params.append(mood)
    query += " ORDER BY e.id"

    with get_db() as connection:
        rows = connection.execute(query, params).fetchall()

    return jsonify({"ok": True, "episodes": [dict(row) for row in rows]})


@app.post("/api/favorites/toggle")
def toggle_favorite():
    body = request.get_json(silent=True) or {}
    user_id = body.get("userId")
    episode_id = body.get("episodeId")

    if not user_id or not episode_id:
        return jsonify({"ok": False, "error": "userId y episodeId obligatorios."}), 400

    with get_db() as connection:
        exists = connection.execute(
            "SELECT id FROM user_favorites WHERE user_id = ? AND episode_id = ?",
            (user_id, episode_id),
        ).fetchone()

        if exists:
            connection.execute(
                "DELETE FROM user_favorites WHERE user_id = ? AND episode_id = ?",
                (user_id, episode_id),
            )
            active = False
        else:
            connection.execute(
                "INSERT INTO user_favorites (user_id, episode_id, created_at) VALUES (?, ?, ?)",
                (user_id, episode_id, now_iso()),
            )
            active = True

    return jsonify({"ok": True, "active": active})


@app.get("/api/users/<int:user_id>/favorites")
def user_favorites(user_id: int):
    with get_db() as connection:
        rows = connection.execute(
            """
            SELECT e.id, e.title, e.duration_min, e.mood, c.name AS channel_name, c.cover_emoji
            FROM user_favorites f
            JOIN episodes e ON e.id = f.episode_id
            JOIN channels c ON c.id = e.channel_id
            WHERE f.user_id = ?
            ORDER BY f.id DESC
            """,
            (user_id,),
        ).fetchall()

    return jsonify({"ok": True, "favorites": [dict(row) for row in rows]})


@app.get("/api/leaderboard")
def leaderboard():
    with get_db() as connection:
        rows = connection.execute(
            """
            SELECT u.id, u.name, u.dni,
                   COUNT(s.id) AS sessions,
                   COALESCE(SUM(s.plays_count), 0) AS plays,
                   COALESCE(SUM(s.favorites_count), 0) AS favorites
            FROM mobile_users u
            LEFT JOIN app_sessions s ON s.user_id = u.id
            GROUP BY u.id, u.name, u.dni
            ORDER BY plays DESC, favorites DESC, sessions DESC
            LIMIT 10
            """
        ).fetchall()

    return jsonify({"ok": True, "leaders": [dict(row) for row in rows]})


@app.get("/api/stats")
def stats():
    with get_db() as connection:
        totals = connection.execute(
            """
            SELECT
                (SELECT COUNT(*) FROM mobile_users) AS users,
                (SELECT COUNT(*) FROM channels) AS channels,
                (SELECT COUNT(*) FROM episodes) AS episodes,
                (SELECT COUNT(*) FROM app_sessions) AS sessions,
                (SELECT COUNT(*) FROM app_events) AS events,
                (SELECT COUNT(*) FROM user_favorites) AS favorites
            """
        ).fetchone()

    return jsonify({"ok": True, "stats": dict(totals)})


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "db": DB_PATH.name, "utc": now_iso()})


if __name__ == "__main__":
    init_db()
    seed_data()
    app.run(debug=True, port=5090)
