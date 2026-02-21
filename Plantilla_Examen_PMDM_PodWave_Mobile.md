# 📝 Plantilla Examen PMDM — PodWave Mobile Lab

## Actividad 005 · Desarrollo de App Móvil (Podcast Mobile-First)

**Alumno:** Luis Jahir Rodriguez Cedeño
**DNI:** 53945291X
**Módulo:** PMDM — Programación Multimedia y Dispositivos Móviles
**Ciclo:** DAM2 · Curso 2025 / 2026

---

## 1. Descripción del proyecto

PodWave Mobile Lab es una aplicación web mobile-first tipo SPA (Single Page Application) que simula una plataforma de podcasts al estilo Spotify. Construida con Flask (backend) y Vanilla JavaScript (frontend), implementa un sistema completo de gestión de canales, episodios, favoritos, sesiones de usuario y telemetría de eventos.

**Puerto:** 5090
**Base de datos:** SQLite (podwave_mobile.sqlite3)
**Filosofía:** Mobile-first, SPA con transiciones animadas, sin frameworks JS

---

## 2. Arquitectura técnica

### 2.1 Backend (Flask + SQLite)

- **Fichero principal:** `app.py` (347 líneas)
- **Base de datos:** SQLite file-based con 6 tablas
- **Patrón:** REST API con respuestas JSON

**Tablas de la base de datos:**

| Tabla            | Propósito                                                              |
| ---------------- | ---------------------------------------------------------------------- |
| `mobile_users`   | Usuarios registrados (name, dni, created_at)                           |
| `channels`       | Canales de podcast (name, description, category, cover_emoji)          |
| `episodes`       | Episodios (title, channel_id, duration_min, mood, cover_emoji)         |
| `app_sessions`   | Sesiones de usuario (user_id, start/end, screens_visited, plays, favs) |
| `user_favorites` | Relación usuario↔episodio para favoritos                               |
| `app_events`     | Eventos de telemetría (session_id, event_type, payload)                |

**Endpoints principales:**

| Método | Ruta                        | Función                                       |
| ------ | --------------------------- | --------------------------------------------- |
| POST   | `/api/users/register`       | Registra o devuelve usuario existente por DNI |
| POST   | `/api/sessions/start`       | Inicia sesión de usuario                      |
| POST   | `/api/sessions/end`         | Cierra sesión con métricas                    |
| POST   | `/api/events`               | Registra evento de telemetría                 |
| GET    | `/api/channels`             | Devuelve todos los canales                    |
| GET    | `/api/episodes?mood=X`      | Episodios con filtro mood opcional            |
| POST   | `/api/favorites/toggle`     | Toggle favorito usuario-episodio              |
| GET    | `/api/users/<id>/favorites` | Favoritos del usuario                         |
| GET    | `/api/leaderboard`          | Ranking con sesiones, plays, favoritos        |
| GET    | `/api/stats`                | Estadísticas globales                         |
| GET    | `/api/health`               | Health check                                  |

### 2.2 Frontend (SPA)

- **HTML:** `templates/index.html` — Shell de la SPA con 3 pantallas
- **JS:** `static/app.js` — Lógica completa del frontend
- **CSS:** `static/styles.css` — Design-System v2 con tokens CSS

**Pantallas:**

1. **Inicio (Home)** — Registro, canales, top episodios
2. **Explorar (Explore)** — Búsqueda, chips de mood, tabla de episodios
3. **Biblioteca (Library)** — Favoritos, seed/export/import, métricas, ranking

---

## 3. Datos seed

La aplicación carga automáticamente datos de prueba:

**3 Canales:**

- Flow Diario ⚡ — Productividad
- Pixel Talks 📱 — Tecnología
- Mind Garden 🌿 — Bienestar

**6 Episodios:**

- Focus nocturno (25 min, Focus)
- Hábitos minimalistas (18 min, Build)
- Apps que uso en 2025 (30 min, Build)
- Diseñar sin Figma (22 min, Focus)
- Respiración 4-7-8 (10 min, Calm)
- Journaling digital (15 min, Calm)

---

## 4. Las 14 mejoras implementadas

### Mejora 1 — Design-System v2 (CSS Tokens)

**Qué:** Catálogo completo de variables CSS: colores (--bg, --card, --accent, --danger...), radios (--radius, --radius-sm, --radius-pill), sombras (--shadow, --shadow-lg), transiciones (--ease, --dur), tipografía (--font).
**Dónde:** `:root` en `styles.css`
**Por qué:** Permite cambiar todo el look&feel modificando solo las variables. Facilita temas y mantenimiento.

### Mejora 2 — Toast Notifications

**Qué:** Sistema de notificaciones con 4 variantes: ok (verde), info (accent), warning (amarillo), danger (rojo). Auto-dismiss a 2.8s con animación.
**Dónde:** `#toast-container` en HTML, función `showToast(msg, type)` en JS, clases `.toast-*` en CSS
**Por qué:** Feedback visual inmediato al usuario sin interrumpir el flujo.

### Mejora 3 — Toggle Dark/Light

**Qué:** Botón 🌙/☀️ en el topbar que alterna entre tema oscuro (por defecto) y claro. Persiste en localStorage.
**Dónde:** `#btnTheme` en HTML, funciones `applyTheme()`/`toggleTheme()`/`initTheme()` en JS, clase `.theme-light` en CSS
**Por qué:** Mejora la accesibilidad y la experiencia visual del usuario según preferencias.

### Mejora 4 — Status LED

**Qué:** Punto circular animado con efecto `pulse` (keyframe `pulse-dot`) que indica que el usuario está logueado.
**Dónde:** `#statusDot` en HTML, `.status-dot.active` en CSS, se activa en `registerUser()` en JS
**Por qué:** Indicador visual instantáneo del estado de la sesión.

### Mejora 5 — Mini-player con barra de progreso

**Qué:** Reproductor fijo sobre el tabbar con: emoji del episodio, título, canal, botón play/pause, botón cerrar, y barra de progreso animada.
**Dónde:** `#miniPlayer` en HTML, funciones `playEpisode()`/`togglePlayPause()`/`closePlayer()`/`startProgress()`/`stopProgress()` en JS, `.mini-player` en CSS
**Por qué:** Simula una experiencia real de audio streaming como Spotify.

### Mejora 6 — Swipe Navigation

**Qué:** Navegación por gestos táctiles horizontales (touchstart/touchend) con umbral de 60px para cambiar entre pestañas.
**Dónde:** Función `initSwipe()` en JS, usa `SCREEN_ORDER = ['home', 'explore', 'library']`
**Por qué:** Navegación natural en dispositivos móviles táctiles.

### Mejora 7 — Búsqueda de episodios

**Qué:** Input con icono 🔍 en Explorar. Filtra client-side por título, canal y mood. Combinable con chips de mood. Debounce de 250ms.
**Dónde:** `#searchInput` en HTML, `.search-bar` en CSS, listener `input` con timeout en JS
**Por qué:** Permite encontrar episodios rápidamente sin recargar la página.

### Mejora 8 — Rank Badges

**Qué:** Badges circulares para las 3 primeras posiciones del ranking: oro (🥇), plata (🥈), bronce (🥉) con colores diferenciados.
**Dónde:** Clases `.rank-badge`, `.rank-1`, `.rank-2`, `.rank-3`, `.rank-other` en CSS, generados en `refreshLeaders()` en JS
**Por qué:** Gamificación visual que incentiva la interacción.

### Mejora 9 — Active Mood Chips

**Qué:** Los chips de filtrado mantienen estado activo con clase `.active` (fondo accent). Solo uno activo a la vez.
**Dónde:** `#moodChips` en HTML, `.chips button.active` en CSS, event listener en JS
**Por qué:** Feedback visual claro de qué filtro está aplicado.

### Mejora 10 — Badge Counts en Tabbar

**Qué:** Contadores numéricos rojos (badge) en las pestañas Explorar (número de episodios) y Biblioteca (número de favoritos).
**Dónde:** `#badgeExplore`, `#badgeLibrary` en HTML, `.tab-badge` en CSS, `updateBadges()` en JS
**Por qué:** El usuario ve de un vistazo cuánto contenido hay disponible.

### Mejora 11 — Keyboard Shortcuts

**Qué:** Atajos: `1`/`2`/`3` (cambiar pestaña), `Space` (play/pause), `Escape` (cerrar player). Desactivados cuando hay un input en foco.
**Dónde:** Función `initKeyboard()` en JS
**Por qué:** Accesibilidad para usuarios de escritorio y eficiencia de navegación.

### Mejora 12 — Seed + Export + Import

**Qué:** 3 botones en Biblioteca: Seed (inserta 3 usuarios de prueba), Export (descarga JSON con leaders+stats+episodes), Import (carga JSON desde archivo).
**Dónde:** `#btnSeed`, `#btnExport`, `#btnImport`, `#importFile` en HTML, funciones `seedData()`/`exportData()`/`importData()`/`handleImportFile()` en JS
**Por qué:** Facilita testing y persistencia portátil de datos.

### Mejora 13 — Empty States

**Qué:** Cuando una lista está vacía se muestra un icono centrado + mensaje descriptivo en lugar de espacio en blanco.
**Dónde:** Función `emptyState(icon, text)` en JS, `.empty-state` en CSS
**Por qué:** UX profesional, el usuario siempre sabe qué esperar.

### Mejora 14 — Responsive 480px

**Qué:** Media query `@media (max-width: 480px)` que elimina bordes del frame, colapsa el register-row a 1 columna y mantiene KPIs en 2 columnas.
**Dónde:** Al final de `styles.css`
**Por qué:** Soporte real para pantallas pequeñas sin necesidad de scroll horizontal.

---

## 5. Flujo de la aplicación

```
1. Usuario abre http://localhost:5090
2. boot() → initTheme(), initSwipe(), initKeyboard(), wireEvents()
3. Se cargan canales, episodios, favoritos, leaders, stats
4. Usuario introduce Nombre + DNI → POST /api/users/register
5. Se inicia sesión → POST /api/sessions/start
6. StatusDot se activa (LED verde pulsante)
7. Navega entre tabs (click, swipe o teclado 1/2/3)
8. Reproduce episodio → mini-player aparece con barra de progreso
9. Toggle favoritos → actualiza BD + badges + toast
10. En Biblioteca: seed datos, exportar/importar JSON
11. Al cerrar → sendBeacon cierra la sesión con métricas
```

---

## 6. Código clave para el examen

### 6.1 Registro de usuario (JS)

```javascript
async function registerUser() {
  const name = el.userName.value.trim();
  const dni = el.userDni.value.trim();
  if (!name || !dni) {
    showToast("Nombre y DNI obligatorios", "warning");
    return;
  }
  const user = await api("/api/users/register", {
    method: "POST",
    body: JSON.stringify({ name, dni }),
  });
  state.userId = user.userId;
  state.userName = user.name;
  const session = await api("/api/sessions/start", {
    method: "POST",
    body: JSON.stringify({ userId: state.userId }),
  });
  state.sessionId = session.sessionId;
  el.statusDot.classList.add("active");
  showToast(`Bienvenido, ${user.name}!`, "ok");
}
```

### 6.2 Toast notifications (JS)

```javascript
function showToast(msg, type = "info") {
  const c = document.getElementById("toast-container");
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  c.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 300);
  }, 2800);
}
```

### 6.3 Mini-player (JS)

```javascript
function playEpisode(ep) {
  state.playing = {
    id: ep.id,
    title: ep.title,
    channel: ep.channel_name,
    emoji: ep.cover_emoji,
    duration: ep.duration_min * 60,
  };
  state.isPlaying = true;
  el.playerTitle.textContent = ep.title;
  el.playerChannel.textContent = ep.channel_name;
  el.miniPlayer.classList.add("active");
  startProgress();
  showToast(`Reproduciendo: ${ep.title}`, "ok");
}
```

### 6.4 Swipe navigation (JS)

```javascript
function initSwipe() {
  const main = document.getElementById("screens");
  main.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].clientX;
    },
    { passive: true },
  );
  main.addEventListener(
    "touchend",
    (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) < 60) return;
      const idx = SCREEN_ORDER.indexOf(state.activeScreen);
      if (dx < 0 && idx < SCREEN_ORDER.length - 1)
        setActiveScreen(SCREEN_ORDER[idx + 1]);
      if (dx > 0 && idx > 0) setActiveScreen(SCREEN_ORDER[idx - 1]);
    },
    { passive: true },
  );
}
```

### 6.5 Theme toggle (JS)

```javascript
function applyTheme(light) {
  document.body.classList.toggle("theme-light", light);
  el.btnTheme.textContent = light ? "☀️" : "🌙";
  localStorage.setItem("podwave-theme", light ? "light" : "dark");
}
```

### 6.6 Keyboard shortcuts (JS)

```javascript
document.addEventListener("keydown", (ev) => {
  if (ev.target.closest("input, textarea")) return;
  if (ev.key === "1") setActiveScreen("home");
  if (ev.key === "2") setActiveScreen("explore");
  if (ev.key === "3") setActiveScreen("library");
  if (ev.key === " ") {
    ev.preventDefault();
    togglePlayPause();
  }
  if (ev.key === "Escape") closePlayer();
});
```

### 6.7 Design-System v2 (CSS tokens)

```css
:root {
  --bg: #0f111f;
  --card: #1a1f38;
  --accent: #5de1c5;
  --danger: #ef4444;
  --success: #10b981;
  --warning: #f59e0b;
  --gold: #fbbf24;
  --silver: #9ca3af;
  --bronze: #d97706;
  --radius: 12px;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  --dur: 0.26s;
}
```

### 6.8 Endpoint de registro (Python)

```python
@app.route('/api/users/register', methods=['POST'])
def register_user():
    data = request.get_json(force=True)
    name = data.get('name', '').strip()
    dni = data.get('dni', '').strip()
    if not name or not dni:
        return jsonify(ok=False, error='name y dni requeridos'), 400
    conn = _db()
    row = conn.execute('SELECT id, name FROM mobile_users WHERE dni = ?', (dni,)).fetchone()
    if row:
        return jsonify(ok=True, userId=row['id'], name=row['name'])
    cur = conn.execute('INSERT INTO mobile_users (name, dni) VALUES (?, ?)', (name, dni))
    conn.commit()
    return jsonify(ok=True, userId=cur.lastrowid, name=name), 201
```

---

## 7. Preguntas frecuentes de examen

**P: ¿Por qué SPA en lugar de navegación tradicional?**
R: Una SPA mantiene el estado en memoria, ofrece transiciones fluidas y reduce las peticiones al servidor. Es el patrón estándar en apps móviles (React Native, Flutter) y nuestra app lo simula con Vanilla JS.

**P: ¿Qué ventaja tienen los CSS Custom Properties?**
R: Permiten un design-system centralizado. Cambiar `--accent` en `:root` actualiza toda la interfaz. Facilitan implementar temas (dark/light) con una sola clase.

**P: ¿Cómo funciona sendBeacon?**
R: `navigator.sendBeacon()` envía datos al servidor de forma asíncrona sin bloquear el cierre de la página. Ideal para enviar métricas de sesión en el evento `beforeunload`.

**P: ¿Cómo se implementa el swipe?**
R: Se captura la posición X en `touchstart` y se compara con la posición en `touchend`. Si la diferencia es > 60px, se navega a la pestaña siguiente (izquierda) o anterior (derecha).

**P: ¿Qué es el debounce de búsqueda?**
R: Se usa `setTimeout` de 250ms para esperar a que el usuario deje de teclear antes de filtrar. Evita ejecuciones innecesarias en cada pulsación de tecla.

**P: ¿Cómo se persiste el tema?**
R: Con `localStorage.setItem('podwave-theme', 'light'|'dark')`. Al cargar la app, `initTheme()` lee el valor y aplica la clase `.theme-light` al body.

---

## 8. Checklist rápido

- [x] Flask + SQLite backend funcional
- [x] 6 tablas de base de datos
- [x] 11 endpoints REST
- [x] SPA con 3 pantallas + transiciones
- [x] Registro de usuarios con sesión
- [x] Telemetría de eventos
- [x] Design-System v2 con CSS tokens
- [x] Toast notifications (4 variantes)
- [x] Toggle dark/light con localStorage
- [x] Status LED animado
- [x] Mini-player con barra de progreso
- [x] Swipe navigation (gestos táctiles)
- [x] Búsqueda de episodios
- [x] Rank badges (oro/plata/bronce)
- [x] Active mood chips
- [x] Badge counts en tabbar
- [x] Keyboard shortcuts
- [x] Seed + Export + Import
- [x] Empty states
- [x] Responsive 480px

---

_Documento generado para el examen de PMDM — PodWave Mobile Lab_
_Luis Jahir Rodriguez Cedeño · 53945291X · DAM2 2025/26_
