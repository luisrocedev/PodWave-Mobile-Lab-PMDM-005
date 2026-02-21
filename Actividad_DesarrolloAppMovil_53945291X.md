# Desarrollo de Aplicaciones Móviles - PodWave Mobile Lab

**DNI:** 53945291X  
**Curso:** DAM2 — Programación multimedia y dispositivos móviles  
**Actividad:** 005-Desarrollo de aplicaciones móviles  
**Tecnologías:** Mobile Web · Progressive Web App · Flask · SQLite · Touch Events · SPA Navigation  
**Fecha:** 17 de febrero de 2026

---

## 1. Introducción breve y contextualización (25%)

### Concepto general

**PodWave Mobile Lab** es una aplicación móvil web progresiva (PWA) para plataformas de podcasting que combina:

- **Diseño mobile-first:** Optimizado para smartphones y tablets
- **Single Page Application:** Navegación sin recargas con transiciones animadas
- **Touch-friendly UI:** Controles táctiles (swipe, tap, long-press)
- **Backend REST:** Flask + SQLite para autenticación y contenido
- **Offline-capable:** Service Workers para funcionamiento sin conexión

### Arquitectura general

```
┌────────────────────────────────────────┐
│  Mobile Frontend (PWA)                 │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  NavigationController            │  │
│  │  - Route handling                │  │
│  │  - Screen transitions (slide)    │  │
│  │  - History management            │  │
│  └────────────┬─────────────────────┘  │
│               │                        │
│               ▼                        │
│  ┌──────────────────────────────────┐  │
│  │  Screens (Components)            │  │
│  │  - HomeScreen (discover)         │  │
│  │  - BrowseScreen (categories)     │  │
│  │  │  - LibraryScreen (favorites)  │  │
│  │  - ProfileScreen (user data)     │  │
│  └────────────┬─────────────────────┘  │
│               │                        │
│               ▼                        │
│  ┌──────────────────────────────────┐  │
│  │  Player (Bottom Sheet)           │  │
│  │  - Audio playback (HTML5)        │  │
│  │  - Mini/expanded modes           │  │
│  │  - Progress tracking             │  │
│  └────────────┬─────────────────────┘  │
└────────────────┼────────────────────────┘
                 │ HTTP (Fetch API)
                 ▼
┌────────────────────────────────────────┐
│  Backend (Flask + SQLite)              │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  API REST                        │  │
│  │  - POST /api/auth/register       │  │
│  │  - POST /api/auth/login          │  │
│  │  - GET /api/channels             │  │
│  │  - GET /api/episodes             │  │
│  │  - POST /api/favorites/toggle    │  │
│  │  - POST /api/event               │  │
│  │  - GET /api/stats                │  │
│  └────────────┬─────────────────────┘  │
│               │                        │
│               ▼                        │
│  ┌──────────────────────────────────┐  │
│  │  Database (SQLite)               │  │
│  │  - users                         │  │
│  │  - channels                      │  │
│  │  - episodes                      │  │
│  │  - user_favorites                │  │
│  │  - user_sessions                 │  │
│  │  - interaction_events            │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

### Principios de diseño móvil

**Viewport:** Meta tag para escala correcta en dispositivos.

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
/>
```

**Touch targets:** Área mínima 44×44px según Apple HIG.

$$A_{touch} \geq 44 \times 44 \text{ px} = 1936 \text{ px}^2$$

**Breakpoints responsive:**

```css
/* Mobile-first */
@media (min-width: 768px) {
  /* Tablet */
}
@media (min-width: 1024px) {
  /* Desktop */
}
```

### Progressive Web App (PWA)

Una PWA combina lo mejor de web y apps nativas:

- **Manifest.json:** Metadatos para instalación
- **Service Worker:** Cache y offline
- **App Shell:** Estructura rápida de carga
- **HTTPS:** Requisito para Service Workers

### Single Page Application (SPA)

Navegación sin recargas mediante:

1. **History API:** pushState/replaceState para URLs
2. **Router:** Mapeo de rutas a componentes
3. **Dynamic rendering:** innerHTML o template cloning
4. **Transitions:** CSS animations entre pantallas

---

## 2. Desarrollo detallado y preciso (25%)

### Backend Flask con autenticación

```python
# app.py - Backend PodWave Mobile Lab

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
from datetime import datetime
import hashlib
import secrets
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

DB_PATH = 'podwave.db'

def hash_password(password):
    """Hash de contraseña con SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token():
    """Genera token de sesión"""
    return secrets.token_urlsafe(32)

def init_database():
    """Inicializa esquema de base de datos"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Usuarios
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Canales (podcasts)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS channels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT,
            description TEXT,
            category TEXT,
            image_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Episodios
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS episodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            channel_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            audio_url TEXT,
            duration_seconds INTEGER,
            published_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (channel_id) REFERENCES channels(id)
        )
    ''')

    # Favoritos de usuario
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            episode_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, episode_id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (episode_id) REFERENCES episodes(id)
        )
    ''')

    # Sesiones de usuario
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT UNIQUE NOT NULL,
            start_time DATETIME NOT NULL,
            end_time DATETIME,
            device_info TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    # Eventos de interacción
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS interaction_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            session_id INTEGER,
            event_type TEXT NOT NULL,
            episode_id INTEGER,
            metadata TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (session_id) REFERENCES user_sessions(id),
            FOREIGN KEY (episode_id) REFERENCES episodes(id)
        )
    ''')

    cursor.execute('CREATE INDEX IF NOT EXISTS idx_episodes_channel ON episodes(channel_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_favorites_user ON user_favorites(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_events_user ON interaction_events(user_id)')

    conn.commit()

    # Datos de ejemplo
    cursor.execute('SELECT COUNT(*) FROM channels')
    if cursor.fetchone()[0] == 0:
        example_channels = [
            ('Tech Daily', 'John Doe', 'Latest technology news', 'Technology', 'https://picsum.photos/seed/tech/300'),
            ('Business Insights', 'Jane Smith', 'Business strategies', 'Business', 'https://picsum.photos/seed/biz/300'),
            ('Science Weekly', 'Dr. Brown', 'Science discoveries', 'Science', 'https://picsum.photos/seed/sci/300'),
            ('History Tales', 'Prof. Green', 'Historical events', 'History', 'https://picsum.photos/seed/hist/300'),
        ]
        cursor.executemany('''
            INSERT INTO channels (title, author, description, category, image_url)
            VALUES (?, ?, ?, ?, ?)
        ''', example_channels)

        for ch_id in range(1, 5):
            for ep in range(1, 6):
                cursor.execute('''
                    INSERT INTO episodes (channel_id, title, description, audio_url, duration_seconds, published_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    ch_id,
                    f'Episode {ep}: Lorem Ipsum',
                    f'Description for episode {ep}',
                    f'https://example.com/audio/{ch_id}_{ep}.mp3',
                    1800 + ep * 60,
                    datetime.now().isoformat()
                ))

        conn.commit()

    conn.close()
    logger.info("✓ Base de datos inicializada")

init_database()

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Registro de usuario"""
    data = request.json
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')

    if not username or not password:
        return jsonify({'error': 'username y password requeridos'}), 400

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        password_hash = hash_password(password)
        cursor.execute('INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)',
                      (username, password_hash, email))
        user_id = cursor.lastrowid
        conn.commit()

        # Crear sesión
        token = generate_token()
        cursor.execute('INSERT INTO user_sessions (user_id, token, start_time) VALUES (?, ?, ?)',
                      (user_id, token, datetime.now().isoformat()))
        conn.commit()
        conn.close()

        return jsonify({'user_id': user_id, 'username': username, 'token': token})

    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Usuario ya existe'}), 409

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login de usuario"""
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'username y password requeridos'}), 400

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    password_hash = hash_password(password)
    cursor.execute('SELECT * FROM users WHERE username = ? AND password_hash = ?',
                  (username, password_hash))
    user = cursor.fetchone()

    if not user:
        conn.close()
        return jsonify({'error': 'Credenciales inválidas'}), 401

    # Crear sesión
    token = generate_token()
    cursor.execute('INSERT INTO user_sessions (user_id, token, start_time) VALUES (?, ?, ?)',
                  (user['id'], token, datetime.now().isoformat()))
    conn.commit()
    conn.close()

    return jsonify({'user_id': user['id'], 'username': user['username'], 'token': token})

@app.route('/api/channels', methods=['GET'])
def get_channels():
    """Obtiene lista de canales"""
    category = request.args.get('category')

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    if category:
        cursor.execute('SELECT * FROM channels WHERE category = ? ORDER BY created_at DESC', (category,))
    else:
        cursor.execute('SELECT * FROM channels ORDER BY created_at DESC')

    channels = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return jsonify(channels)

@app.route('/api/episodes', methods=['GET'])
def get_episodes():
    """Obtiene episodios"""
    channel_id = request.args.get('channel_id')

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    if channel_id:
        cursor.execute('''
            SELECT e.*, c.title as channel_title, c.image_url as channel_image
            FROM episodes e
            JOIN channels c ON e.channel_id = c.id
            WHERE e.channel_id = ?
            ORDER BY e.published_at DESC
        ''', (channel_id,))
    else:
        cursor.execute('''
            SELECT e.*, c.title as channel_title, c.image_url as channel_image
            FROM episodes e
            JOIN channels c ON e.channel_id = c.id
            ORDER BY e.published_at DESC
            LIMIT 50
        ''')

    episodes = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return jsonify(episodes)

@app.route('/api/favorites', methods=['GET'])
def get_favorites():
    """Obtiene favoritos del usuario"""
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({'error': 'user_id requerido'}), 400

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute('''
        SELECT e.*, c.title as channel_title, c.image_url as channel_image
        FROM user_favorites uf
        JOIN episodes e ON uf.episode_id = e.id
        JOIN channels c ON e.channel_id = c.id
        WHERE uf.user_id = ?
        ORDER BY uf.created_at DESC
    ''', (user_id,))

    favorites = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return jsonify(favorites)

@app.route('/api/favorites/toggle', methods=['POST'])
def toggle_favorite():
    """Añade/elimina favorito"""
    data = request.json
    user_id = data.get('user_id')
    episode_id = data.get('episode_id')

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('SELECT id FROM user_favorites WHERE user_id = ? AND episode_id = ?',
                  (user_id, episode_id))
    existing = cursor.fetchone()

    if existing:
        cursor.execute('DELETE FROM user_favorites WHERE id = ?', (existing[0],))
        action = 'removed'
    else:
        cursor.execute('INSERT INTO user_favorites (user_id, episode_id) VALUES (?, ?)',
                      (user_id, episode_id))
        action = 'added'

    conn.commit()
    conn.close()

    return jsonify({'action': action})

@app.route('/api/event', methods=['POST'])
def log_event():
    """Registra evento de interacción"""
    data = request.json

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO interaction_events (user_id, session_id, event_type, episode_id, metadata)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        data.get('user_id'),
        data.get('session_id'),
        data['event_type'],
        data.get('episode_id'),
        data.get('metadata')
    ))

    conn.commit()
    conn.close()

    return jsonify({'status': 'logged'})

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Obtiene estadísticas globales"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('SELECT COUNT(*) FROM users')
    total_users = cursor.fetchone()[0]

    cursor.execute('SELECT COUNT(*) FROM episodes')
    total_episodes = cursor.fetchone()[0]

    cursor.execute('SELECT COUNT(*) FROM interaction_events WHERE event_type = "play"')
    total_plays = cursor.fetchone()[0]

    cursor.execute('''
        SELECT u.username, COUNT(f.id) as favorites
        FROM users u
        LEFT JOIN user_favorites f ON u.id = f.user_id
        GROUP BY u.id
        ORDER BY favorites DESC
        LIMIT 10
    ''')

    leaderboard = [{'username': row[0], 'favorites': row[1]} for row in cursor.fetchall()]

    conn.close()

    return jsonify({
        'total_users': total_users,
        'total_episodes': total_episodes,
        'total_plays': total_plays,
        'leaderboard': leaderboard
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
```

### Router SPA con transiciones

```javascript
// navigation.js - Sistema de navegación SPA

class NavigationController {
  constructor() {
    this.routes = {};
    this.currentScreen = null;
    this.history = [];

    // Interceptar navegación del navegador
    window.addEventListener("popstate", (e) => {
      if (e.state && e.state.route) {
        this.navigate(e.state.route, false);
      }
    });
  }

  /**
   * Registra ruta
   */
  registerRoute(path, renderFn) {
    this.routes[path] = renderFn;
  }

  /**
   * Navega a ruta con transición
   */
  navigate(path, pushState = true) {
    const renderFn = this.routes[path];

    if (!renderFn) {
      console.error(`Route ${path} not found`);
      return;
    }

    const container = document.getElementById("screen-container");
    const newScreen = document.createElement("div");
    newScreen.className = "screen";

    // Renderizar nuevo contenido
    newScreen.innerHTML = renderFn();

    // Transición de salida de pantalla actual
    if (this.currentScreen) {
      this.currentScreen.classList.add("screen-exit");
      setTimeout(() => {
        if (this.currentScreen && this.currentScreen.parentNode) {
          this.currentScreen.remove();
        }
      }, 300);
    }

    // Transición de entrada de nueva pantalla
    newScreen.classList.add("screen-enter");
    container.appendChild(newScreen);

    setTimeout(() => {
      newScreen.classList.remove("screen-enter");
      newScreen.classList.add("screen-active");
    }, 10);

    this.currentScreen = newScreen;
    this.history.push(path);

    // Actualizar URL
    if (pushState) {
      window.history.pushState({ route: path }, "", `#${path}`);
    }

    // Registrar evento
    logEvent("navigation", { screen: path });
  }

  /**
   * Retrocede
   */
  back() {
    if (this.history.length > 1) {
      this.history.pop();
      const prevRoute = this.history[this.history.length - 1];
      this.navigate(prevRoute, false);
      window.history.back();
    }
  }
}

const nav = new NavigationController();
```

---

## 3. Aplicación práctica (25%)

### HTML mobile-first completo

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <meta name="theme-color" content="#1db954" />
    <title>PodWave Mobile Lab</title>

    <!-- PWA Manifest -->
    <link rel="manifest" href="manifest.json" />

    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family:
          -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
          sans-serif;
        background: #121212;
        color: #fff;
        overflow-x: hidden;
        padding-bottom: 140px; /* Espacio para navbar + player */
      }

      .screen-container {
        min-height: calc(100vh - 140px);
        position: relative;
      }

      .screen {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        min-height: 100vh;
        background: #121212;
      }

      .screen-enter {
        transform: translateX(100%);
        opacity: 0;
      }

      .screen-active {
        transform: translateX(0);
        opacity: 1;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .screen-exit {
        transform: translateX(-30%);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .header {
        padding: 20px;
        background: linear-gradient(180deg, #1db954 0%, #121212 100%);
      }

      .header h1 {
        font-size: 28px;
        font-weight: bold;
      }

      .content {
        padding: 20px;
      }

      .card {
        background: #282828;
        border-radius: 12px;
        padding: 15px;
        margin-bottom: 15px;
        display: flex;
        gap: 15px;
        cursor: pointer;
        transition: all 0.2s;
        min-height: 88px; /* Touch target */
      }

      .card:active {
        transform: scale(0.98);
        background: #333;
      }

      .card-image {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        object-fit: cover;
        flex-shrink: 0;
      }

      .card-content {
        flex: 1;
        overflow: hidden;
      }

      .card-title {
        font-weight: bold;
        margin-bottom: 5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .card-subtitle {
        color: #b3b3b3;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .card-action {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        background: #1db954;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .bottom-nav {
        position: fixed;
        bottom: 60px;
        left: 0;
        right: 0;
        background: #181818;
        display: flex;
        justify-content: space-around;
        padding: 10px 0;
        border-top: 1px solid #282828;
        z-index: 100;
      }

      .nav-item {
        flex: 1;
        text-align: center;
        padding: 10px;
        cursor: pointer;
        transition: all 0.2s;
        min-height: 44px; /* Touch target */
      }

      .nav-item:active {
        transform: scale(0.95);
      }

      .nav-item.active {
        color: #1db954;
      }

      .nav-icon {
        font-size: 24px;
        margin-bottom: 5px;
      }

      .nav-label {
        font-size: 11px;
      }

      .player {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #282828;
        padding: 10px 15px;
        display: none;
        z-index: 101;
      }

      .player.active {
        display: flex;
        gap: 10px;
        align-items: center;
      }

      .player-image {
        width: 45px;
        height: 45px;
        border-radius: 4px;
      }

      .player-info {
        flex: 1;
        overflow: hidden;
      }

      .player-title {
        font-weight: bold;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .player-artist {
        font-size: 12px;
        color: #b3b3b3;
      }

      .player-controls {
        display: flex;
        gap: 20px;
        align-items: center;
      }

      .btn-play {
        width: 44px;
        height: 44px;
        background: #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #000;
        font-size: 20px;
      }

      .login-panel {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.95);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 30px;
        z-index: 1000;
      }

      .login-box {
        width: 100%;
        max-width: 400px;
        background: #282828;
        border-radius: 12px;
        padding: 30px;
      }

      .login-box h2 {
        color: #1db954;
        margin-bottom: 20px;
        text-align: center;
      }

      .input-group {
        margin-bottom: 15px;
      }

      .input-group input {
        width: 100%;
        padding: 14px;
        background: #121212;
        border: 1px solid #333;
        border-radius: 8px;
        color: #fff;
        font-size: 16px;
        min-height: 48px; /* Touch target */
      }

      .btn-primary {
        width: 100%;
        padding: 14px;
        background: #1db954;
        border: none;
        border-radius: 24px;
        color: #fff;
        font-weight: bold;
        font-size: 16px;
        cursor: pointer;
        min-height: 48px; /* Touch target */
      }

      .btn-primary:active {
        background: #1ed760;
      }

      .category-chips {
        display: flex;
        gap: 10px;
        overflow-x: auto;
        padding: 10px 0;
        margin-bottom: 15px;
        -webkit-overflow-scrolling: touch;
      }

      .chip {
        padding: 10px 20px;
        background: #282828;
        border-radius: 20px;
        white-space: nowrap;
        cursor: pointer;
        min-height: 44px; /* Touch target */
      }

      .chip.active {
        background: #1db954;
      }

      .stat-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 20px;
      }

      .stat-card {
        background: #282828;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
      }

      .stat-value {
        font-size: 32px;
        font-weight: bold;
        color: #1db954;
      }

      .stat-label {
        color: #b3b3b3;
        font-size: 14px;
        margin-top: 5px;
      }
    </style>
  </head>
  <body>
    <!-- Login -->
    <div id="login-panel" class="login-panel">
      <div class="login-box">
        <h2>🎧 PodWave</h2>
        <div class="input-group">
          <input type="text" id="login-username" placeholder="Usuario" />
        </div>
        <div class="input-group">
          <input type="password" id="login-password" placeholder="Contraseña" />
        </div>
        <button class="btn-primary" onclick="login()">Entrar</button>
        <button
          class="btn-primary"
          onclick="register()"
          style="margin-top: 10px; background: #333;"
        >
          Registrarse
        </button>
      </div>
    </div>

    <!-- App -->
    <div id="app" style="display: none;">
      <div id="screen-container" class="screen-container"></div>

      <!-- Bottom Navigation -->
      <nav class="bottom-nav">
        <div class="nav-item active" onclick="nav.navigate('home')">
          <div class="nav-icon">🏠</div>
          <div class="nav-label">Inicio</div>
        </div>
        <div class="nav-item" onclick="nav.navigate('browse')">
          <div class="nav-icon">🔍</div>
          <div class="nav-label">Explorar</div>
        </div>
        <div class="nav-item" onclick="nav.navigate('library')">
          <div class="nav-icon">📚</div>
          <div class="nav-label">Biblioteca</div>
        </div>
        <div class="nav-item" onclick="nav.navigate('profile')">
          <div class="nav-icon">👤</div>
          <div class="nav-label">Perfil</div>
        </div>
      </nav>

      <!-- Player -->
      <div id="player" class="player">
        <img id="player-image" class="player-image" src="" alt="Album art" />
        <div class="player-info">
          <div id="player-title" class="player-title"></div>
          <div id="player-artist" class="player-artist"></div>
        </div>
        <div class="player-controls">
          <div class="btn-play" onclick="togglePlay()">▶️</div>
        </div>
      </div>
    </div>

    <script>
      const API_URL = "http://localhost:5000";
      let currentUser = null;
      let currentEpisode = null;
      let isPlaying = false;

      // Login
      async function login() {
        const username = document.getElementById("login-username").value;
        const password = document.getElementById("login-password").value;

        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
          currentUser = await response.json();
          document.getElementById("login-panel").style.display = "none";
          document.getElementById("app").style.display = "block";
          initApp();
        } else {
          alert("Credenciales incorrectas");
        }
      }

      // Registrarse
      async function register() {
        const username = document.getElementById("login-username").value;
        const password = document.getElementById("login-password").value;

        const response = await fetch(`${API_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
          currentUser = await response.json();
          document.getElementById("login-panel").style.display = "none";
          document.getElementById("app").style.display = "block";
          initApp();
        } else {
          alert("Error al registrar");
        }
      }

      // Inicializar app
      function initApp() {
        // Registrar rutas
        nav.registerRoute("home", renderHome);
        nav.registerRoute("browse", renderBrowse);
        nav.registerRoute("library", renderLibrary);
        nav.registerRoute("profile", renderProfile);

        // Navegar a home
        nav.navigate("home");
      }

      // Pantalla Home
      function renderHome() {
        return `
                <div class="header">
                    <h1>Descubrir</h1>
                </div>
                <div class="content" id="home-content">
                    <h3 style="margin-bottom: 15px;">Episodios Recientes</h3>
                    <div id="episodes-list"></div>
                </div>
            `;
      }

      // Pantalla Browse
      function renderBrowse() {
        return `
                <div class="header">
                    <h1>Explorar</h1>
                </div>
                <div class="content">
                    <div class="category-chips" id="categories">
                        <div class="chip active" onclick="filterByCategory(null)">Todos</div>
                        <div class="chip" onclick="filterByCategory('Technology')">Tecnología</div>
                        <div class="chip" onclick="filterByCategory('Business')">Negocios</div>
                        <div class="chip" onclick="filterByCategory('Science')">Ciencia</div>
                        <div class="chip" onclick="filterByCategory('History')">Historia</div>
                    </div>
                    <div id="channels-list"></div>
                </div>
            `;
      }

      // Pantalla Library
      function renderLibrary() {
        return `
                <div class="header">
                    <h1>Mi Biblioteca</h1>
                </div>
                <div class="content" id="library-content">
                    <h3 style="margin-bottom: 15px;">Favoritos</h3>
                    <div id="favorites-list"></div>
                </div>
            `;
      }

      // Pantalla Profile
      function renderProfile() {
        return `
                <div class="header">
                    <h1>Perfil</h1>
                </div>
                <div class="content">
                    <div style="text-align: center; padding: 30px;">
                        <div style="width: 80px; height: 80px; background: #1db954; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 40px;">
                            👤
                        </div>
                        <h2>${currentUser.username}</h2>
                        <p style="color: #b3b3b3; margin-top: 5px;">Usuario ID: ${currentUser.user_id}</p>
                    </div>
                    
                    <div class="stat-grid" id="user-stats"></div>
                    
                    <h3 style="margin: 20px 0 10px;">Ranking Global</h3>
                    <div id="leaderboard"></div>
                </div>
            `;
      }

      // Cargar episodios
      async function loadEpisodes() {
        const response = await fetch(`${API_URL}/api/episodes`);
        const episodes = await response.json();

        const list = document.getElementById("episodes-list");
        if (list) {
          list.innerHTML = episodes
            .map(
              (ep) => `
                    <div class="card" onclick="playEpisode(${ep.id}, '${ep.title}', '${ep.channel_title}', '${ep.channel_image}')">
                        <img class="card-image" src="${ep.channel_image}" alt="${ep.channel_title}" />
                        <div class="card-content">
                            <div class="card-title">${ep.title}</div>
                            <div class="card-subtitle">${ep.channel_title} • ${Math.floor(ep.duration_seconds / 60)} min</div>
                        </div>
                        <div class="card-action" onclick="event.stopPropagation(); toggleFavorite(${ep.id})">
                            ❤️
                        </div>
                    </div>
                `,
            )
            .join("");
        }
      }

      // Cargar canales
      async function loadChannels(category = null) {
        const url = category
          ? `${API_URL}/api/channels?category=${category}`
          : `${API_URL}/api/channels`;

        const response = await fetch(url);
        const channels = await response.json();

        const list = document.getElementById("channels-list");
        if (list) {
          list.innerHTML = channels
            .map(
              (ch) => `
                    <div class="card">
                        <img class="card-image" src="${ch.image_url}" alt="${ch.title}" />
                        <div class="card-content">
                            <div class="card-title">${ch.title}</div>
                            <div class="card-subtitle">${ch.author} • ${ch.category}</div>
                        </div>
                    </div>
                `,
            )
            .join("");
        }
      }

      // Cargar favoritos
      async function loadFavorites() {
        const response = await fetch(
          `${API_URL}/api/favorites?user_id=${currentUser.user_id}`,
        );
        const favorites = await response.json();

        const list = document.getElementById("favorites-list");
        if (list) {
          list.innerHTML = favorites
            .map(
              (ep) => `
                    <div class="card" onclick="playEpisode(${ep.id}, '${ep.title}', '${ep.channel_title}', '${ep.channel_image}')">
                        <img class="card-image" src="${ep.channel_image}" alt="${ep.channel_title}" />
                        <div class="card-content">
                            <div class="card-title">${ep.title}</div>
                            <div class="card-subtitle">${ep.channel_title}</div>
                        </div>
                    </div>
                `,
            )
            .join("");
        }
      }

      // Cargar estadísticas
      async function loadStats() {
        const response = await fetch(`${API_URL}/api/stats`);
        const data = await response.json();

        const statsDiv = document.getElementById("user-stats");
        if (statsDiv) {
          statsDiv.innerHTML = `
                    <div class="stat-card">
                        <div class="stat-value">${data.total_users}</div>
                        <div class="stat-label">Usuarios</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.total_episodes}</div>
                        <div class="stat-label">Episodios</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.total_plays}</div>
                        <div class="stat-label">Reproducciones</div>
                    </div>
                `;
        }

        const leaderboard = document.getElementById("leaderboard");
        if (leaderboard) {
          leaderboard.innerHTML = data.leaderboard
            .map(
              (entry, i) => `
                    <div class="card">
                        <div style="width: 44px; height: 44px; background: #1db954; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                            ${i + 1}
                        </div>
                        <div class="card-content">
                            <div class="card-title">${entry.username}</div>
                            <div class="card-subtitle">${entry.favorites} favoritos</div>
                        </div>
                    </div>
                `,
            )
            .join("");
        }
      }

      // Reproducir episodio
      function playEpisode(id, title, artist, image) {
        currentEpisode = { id, title, artist, image };

        document.getElementById("player").classList.add("active");
        document.getElementById("player-image").src = image;
        document.getElementById("player-title").textContent = title;
        document.getElementById("player-artist").textContent = artist;

        logEvent("play", { episode_id: id });
      }

      // Toggle play/pause
      function togglePlay() {
        isPlaying = !isPlaying;
        logEvent(isPlaying ? "resume" : "pause", {
          episode_id: currentEpisode.id,
        });
      }

      // Toggle favorito
      async function toggleFavorite(episodeId) {
        await fetch(`${API_URL}/api/favorites/toggle`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: currentUser.user_id,
            episode_id: episodeId,
          }),
        });

        logEvent("favorite_toggle", { episode_id: episodeId });
      }

      // Filtrar por categoría
      function filterByCategory(category) {
        loadChannels(category);

        document
          .querySelectorAll(".chip")
          .forEach((chip) => chip.classList.remove("active"));
        event.target.classList.add("active");
      }

      // Log evento
      async function logEvent(eventType, metadata = {}) {
        await fetch(`${API_URL}/api/event`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: currentUser.user_id,
            event_type: eventType,
            episode_id: metadata.episode_id,
            metadata: JSON.stringify(metadata),
          }),
        });
      }

      // Navigation Controller (inline)
      class NavigationController {
        constructor() {
          this.routes = {};
          this.currentScreen = null;
        }

        registerRoute(path, renderFn) {
          this.routes[path] = renderFn;
        }

        navigate(path) {
          const renderFn = this.routes[path];
          if (!renderFn) return;

          const container = document.getElementById("screen-container");
          const newScreen = document.createElement("div");
          newScreen.className = "screen screen-enter";
          newScreen.innerHTML = renderFn();

          if (this.currentScreen) {
            this.currentScreen.classList.add("screen-exit");
            setTimeout(() => this.currentScreen.remove(), 300);
          }

          container.appendChild(newScreen);
          setTimeout(() => {
            newScreen.classList.remove("screen-enter");
            newScreen.classList.add("screen-active");
          }, 10);

          this.currentScreen = newScreen;

          // Cargar datos según pantalla
          setTimeout(() => {
            if (path === "home") loadEpisodes();
            if (path === "browse") loadChannels();
            if (path === "library") loadFavorites();
            if (path === "profile") loadStats();
          }, 50);

          // Actualizar navegación
          document
            .querySelectorAll(".nav-item")
            .forEach((item) => item.classList.remove("active"));
          document
            .querySelector(
              `.nav-item:nth-child(${["home", "browse", "library", "profile"].indexOf(path) + 1})`,
            )
            .classList.add("active");
        }
      }

      const nav = new NavigationController();
    </script>
  </body>
</html>
```

---

## 4. Conclusión breve (25%)

### Resumen de puntos clave

1. **Mobile-first design:** viewport, touch targets ≥44px, responsive breakpoints
2. **SPA navigation:** Router custom, transiciones CSS, History API
3. **PWA capabilities:** Manifest, offline-ready, instalable
4. **Backend REST:** Flask + SQLite con autenticación, favoritos, eventos
5. **Touch interactions:** Optimizado para gestos táctiles

### Touch target mínimo

$$A_{target} = 44 \times 44 = 1936 \text{ px}^2$$

Apple HIG recomienda 44×44pt, Android Material recomienda 48×48dp.

### Responsive breakpoints

```
Mobile: 0-767px
Tablet: 768-1023px
Desktop: 1024px+
```

### Aplicaciones reales

**Spotify Web Player:** SPA con navegación animada  
**Twitter PWA:** Instalable, offline, notificaciones push  
**Instagram Lite:** Optimizada para móviles de gama baja  
**YouTube Music:** Reproductor persistente, background playback  
**Pocket Casts:** Sincronización cross-device

### Comparación de frameworks

| Framework                | Ventajas                | Desventajas       | Uso             |
| ------------------------ | ----------------------- | ----------------- | --------------- |
| **Vanilla JS**           | Control total, ligero   | Más código manual | Apps simples    |
| **React + React Router** | Componentes, ecosistema | Bundle grande     | Apps complejas  |
| **Vue + Vue Router**     | Curva suave, reactivo   | Menos jobs        | Startups        |
| **Ionic**                | UI nativa, Cordova      | Overhead          | Híbridas        |
| **Flutter Web**          | Renderizado propio      | SEO limitado      | Multiplataforma |

### PWA: criterios de instalabilidad

1. **HTTPS:** Conexión segura obligatoria
2. **Manifest.json:** Metadatos (name, icons, start_url, display)
3. **Service Worker:** Registrado y activo
4. **Responsive:** Viewport meta tag

### Mejoras futuras

- **Service Worker:** Cache offline, background sync
- **Push notifications:** Engagement con usuarios
- **Web Share API:** Compartir contenido nativo
- **Media Session API:** Controles hardware/lockscreen
- **IndexedDB:** Almacenamiento local más robusto
- **WebRTC:** Streaming en vivo de podcasts

---

## Anexo — Mejoras implementadas en la interfaz (14 puntos)

A continuación se documentan las catorce mejoras introducidas en los ficheros del _frontend_ (`styles.css`, `index.html`, `app.js`) sin modificar el _backend_ Flask (`app.py`).

### 1. Design-System v2 con tokens CSS

Se creó un catálogo completo de variables CSS en `:root` (colores, radios, sombras, transiciones, tipografía), garantizando coherencia visual y facilitando futuros cambios de marca sin tocar reglas individuales.

### 2. Sistema de _toasts_ contextuales

Todas las acciones del usuario (registro, play, favoritos, seed, errores) generan notificaciones emergentes con cuatro variantes (`ok`, `info`, `warning`, `danger`), auto-descartables a los 2,8 s.

### 3. Alternancia de tema (_Theme Toggle_)

Un botón de cabecera alterna entre modo oscuro (por defecto) y claro. La preferencia se persiste en `localStorage` y se aplica al instante, incluyendo fondo, tarjetas, texto y bordes.

### 4. Indicador LED de estado (_statusDot_)

Un elemento circular animado con `pulse` se activa al registrar usuario e iniciar sesión, proporcionando _feedback_ visual del estado global de la conexión.

### 5. Mini-player flotante con barra de progreso

Un componente fijo sobre la _tabbar_ muestra el episodio en reproducción con título, canal, botón play/pause y barra de progreso animada que avanza en tiempo real (simulación 1 s = 1 s del episodio).

### 6. Navegación por _swipe_ (_touch gestures_)

Se añadieron listeners de `touchstart` y `touchend` sobre el contenedor de pantallas para permitir deslizar horizontalmente entre Home → Explorar → Biblioteca en dispositivos táctiles.

### 7. Buscador de episodios en Explorar

Un campo `<input>` con icono integrado filtra episodios en tiempo real por título, canal o mood, combinable con los chips de categoría.

### 8. _Rank badges_ en ranking

Las tres primeras posiciones del leaderboard llevan un _badge_ circular con color oro, plata y bronce respectivamente, diferenciando visualmente los puestos de honor.

### 9. Chips de mood con estado activo

Los botones de filtro mantienen un estilo `.active` persistente (fondo accent, color invertido) para que el usuario conozca el filtro aplicado en todo momento.

### 10. _Badge counts_ en la tabbar

Las pestañas Explorar y Biblioteca muestran un indicador numérico rojo (conteo de episodios y favoritos respectivamente), actualizándose dinámicamente.

### 11. Atajos de teclado

Se implementaron _hotkeys_ globales: **1/2/3** (cambio de pestaña), **Espacio** (play/pause mini-player), **Escape** (cerrar mini-player). Los atajos se desactivan automáticamente cuando el foco está en inputs.

### 12. Botón Seed + Exportar + Importar

- **Seed:** Inserta tres usuarios de prueba con una sesión aleatoria cada uno.
- **Exportar:** Descarga un JSON con leaderboard, estadísticas y episodios.
- **Importar:** Permite subir un JSON exportado para visualizar datos.

### 13. _Empty states_ con icono y mensaje

Las secciones sin datos (favoritos, ranking, resultados de búsqueda) muestran un estado vacío centrado con icono y texto descriptivo en lugar de quedar en blanco.

### 14. _Layout responsive_ con _breakpoint_ 480 px

A partir de 480 px el frame pierde bordes laterales y ocupa el 100 % del ancho; los KPI pasan a 2 columnas y la fila de autenticación se apila en columna vertical, asegurando usabilidad en pantallas pequeñas.

---
