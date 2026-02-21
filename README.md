<div align="center">

# 🎧 PodWave Mobile Lab

**Laboratorio de desarrollo móvil · Plataforma de podcasts mobile-first**

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.x-000?logo=flask)](https://flask.palletsprojects.com)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)](https://sqlite.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production-brightgreen)]()

_Aplicación de tipo Spotify/Podcast mobile-first construida como SPA con Flask + Vanilla JS_

</div>

---

## 📋 Índice

- [Descripción](#-descripción)
- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Stack tecnológico](#-stack-tecnológico)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [API REST](#-api-rest)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Mejoras implementadas](#-mejoras-implementadas)
- [Autor](#-autor)

---

## 🎯 Descripción

**PodWave Mobile Lab** es un laboratorio práctico de desarrollo móvil (PMDM — Programación Multimedia y Dispositivos Móviles) que simula una plataforma de gestión de podcasts al estilo Spotify. La aplicación implementa una interfaz mobile-first con navegación por pestañas, sistema de sesiones, telemetría de eventos y un reproductor integrado.

El proyecto demuestra competencias clave en desarrollo móvil: gestión de estados complejos, rendimiento en dispositivos táctiles, persistencia local, accesibilidad y diseño adaptativo.

---

## ✨ Características

### Core

| Módulo                         | Descripción                                                      |
| ------------------------------ | ---------------------------------------------------------------- |
| 📱 **SPA Mobile-First**        | Interfaz optimizada para pantallas ≤430px con frame centrado     |
| 🗂 **3 Pantallas**             | Inicio · Explorar · Biblioteca con transiciones animadas         |
| 🔐 **Registro de usuarios**    | Alta con nombre + DNI, inicio de sesión automático               |
| 🎵 **Canales y episodios**     | 3 canales de podcast, 6 episodios con moods (Focus/Build/Calm)   |
| ❤️ **Favoritos**               | Toggle de favoritos por episodio con persistencia en BD          |
| 📊 **Métricas en tiempo real** | KPIs: usuarios, canales, episodios, sesiones, eventos, favoritos |
| 🏆 **Ranking**                 | Leaderboard con sesiones, plays y favoritos por usuario          |
| 📡 **Telemetría**              | Logging de eventos (screen_view, play, favorite, session)        |

### 14 Mejoras Avanzadas

| #   | Mejora                                                                                             | Estado |
| --- | -------------------------------------------------------------------------------------------------- | ------ |
| 1   | 🎨 **Design-System v2** — Catálogo completo de CSS tokens (colores, radios, sombras, transiciones) | ✅     |
| 2   | 🔔 **Toast Notifications** — 4 variantes (ok/info/warning/danger), auto-dismiss 2.8s               | ✅     |
| 3   | 🌓 **Toggle Dark/Light** — Tema persistente con localStorage                                       | ✅     |
| 4   | 🟢 **Status LED** — Indicador animado con pulse al hacer login                                     | ✅     |
| 5   | 🎵 **Mini-player** — Reproductor fijo con barra de progreso                                        | ✅     |
| 6   | 👆 **Swipe Navigation** — Gestos táctiles horizontales entre tabs                                  | ✅     |
| 7   | 🔍 **Búsqueda de episodios** — Filtrado por título, canal y mood                                   | ✅     |
| 8   | 🥇 **Rank Badges** — Medallas oro/plata/bronce para top 3                                          | ✅     |
| 9   | 💊 **Active Mood Chips** — Estado persistente `.active` con acento                                 | ✅     |
| 10  | 🔴 **Badge Counts** — Contadores en Explorar (#episodios) y Biblioteca (#favoritos)                | ✅     |
| 11  | ⌨️ **Keyboard Shortcuts** — 1/2/3 (tabs), Space (play/pause), Esc (cerrar player)                  | ✅     |
| 12  | 🌱 **Seed + Export + Import** — Datos de prueba, export/import JSON                                | ✅     |
| 13  | 📭 **Empty States** — Icono + mensaje cuando no hay datos                                          | ✅     |
| 14  | 📐 **Responsive 480px** — Full width, 2-col KPIs, auth row colapsado                               | ✅     |

---

## 🏗 Arquitectura

```
┌─────────────────────────────────────────────┐
│              FRONTEND (SPA)                 │
│  index.html + app.js + styles.css           │
│  ┌───────┐ ┌──────────┐ ┌─────────────┐    │
│  │ Home  │ │ Explore  │ │  Library    │    │
│  └───┬───┘ └────┬─────┘ └──────┬──────┘    │
│      └──────────┼───────────────┘           │
│           fetch() / JSON                    │
├─────────────────┼───────────────────────────┤
│              BACKEND (Flask)                │
│           app.py · Port 5090               │
│  ┌──────────────┼──────────────────┐        │
│  │  /api/users  │  /api/episodes   │        │
│  │  /api/sessions /api/favorites   │        │
│  │  /api/events   /api/leaderboard │        │
│  │  /api/channels /api/stats       │        │
│  └──────────────┼──────────────────┘        │
│           SQLite (file-based)               │
│  podwave_mobile.sqlite3                     │
└─────────────────────────────────────────────┘
```

---

## 🛠 Stack tecnológico

| Capa          | Tecnología                                            |
| ------------- | ----------------------------------------------------- |
| Backend       | Python 3.10+ · Flask 3.x                              |
| Base de datos | SQLite 3 (file-based)                                 |
| Frontend      | HTML5 · CSS3 · Vanilla JavaScript ES6+                |
| Diseño        | Mobile-first · CSS Grid · Flexbox · Custom Properties |
| Servidor      | Development server (Werkzeug)                         |

---

## 🚀 Instalación

### Requisitos previos

- Python 3.10+
- pip

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/YOUR_USER/PodWave-Mobile-Lab-PMDM-005.git
cd PodWave-Mobile-Lab-PMDM-005

# 2. Crear entorno virtual (recomendado)
python3 -m venv venv
source venv/bin/activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Ejecutar la aplicación
python3 app.py
```

La app estará disponible en **http://localhost:5090**

> 💡 La base de datos SQLite se crea automáticamente con datos seed al iniciar la aplicación.

---

## 📖 Uso

1. **Abre** `http://localhost:5090` en un navegador (Chrome DevTools + modo dispositivo recomendado)
2. **Regístrate** introduciendo tu nombre y DNI en la pantalla de Inicio
3. **Navega** entre las 3 pestañas: Inicio, Explorar, Biblioteca
4. **Reproduce** episodios desde cualquier pantalla — el mini-player aparecerá automáticamente
5. **Filtra** por mood (Focus/Build/Calm) o busca episodios por texto en Explorar
6. **Marca favoritos** y consulta tu ranking en la Biblioteca
7. **Usa atajos de teclado**: `1` `2` `3` para cambiar de pestaña, `Space` para play/pause, `Esc` para cerrar el player
8. **Cambia el tema** con el botón 🌙 en la barra superior

---

## 📡 API REST

| Método | Endpoint                   | Descripción                                                               |
| ------ | -------------------------- | ------------------------------------------------------------------------- |
| `POST` | `/api/users/register`      | Registrar/login usuario `{name, dni}`                                     |
| `POST` | `/api/sessions/start`      | Iniciar sesión `{userId}`                                                 |
| `POST` | `/api/sessions/end`        | Cerrar sesión `{sessionId, screensVisited, playsCount, favoritesCount}`   |
| `POST` | `/api/events`              | Registrar evento `{sessionId, eventType, episodeId, screenName, payload}` |
| `GET`  | `/api/channels`            | Listar canales                                                            |
| `GET`  | `/api/episodes?mood=X`     | Listar episodios (filtro mood opcional)                                   |
| `POST` | `/api/favorites/toggle`    | Toggle favorito `{userId, episodeId}`                                     |
| `GET`  | `/api/users/:id/favorites` | Obtener favoritos del usuario                                             |
| `GET`  | `/api/leaderboard`         | Ranking de usuarios                                                       |
| `GET`  | `/api/stats`               | Estadísticas globales                                                     |
| `GET`  | `/api/health`              | Health check                                                              |

---

## 📁 Estructura del proyecto

```
PodWave-Mobile-Lab-PMDM-005/
├── app.py                          # Backend Flask + SQLite (347 líneas)
├── requirements.txt                # Dependencias Python
├── podwave_mobile.sqlite3          # Base de datos (auto-generada)
├── templates/
│   └── index.html                  # SPA shell con mini-player, toast, search
├── static/
│   ├── app.js                      # Frontend completo con 14 mejoras
│   └── styles.css                  # Design-System v2 con tokens CSS
├── docs/
│   └── Actividad_DesarrolloAppMovil_53945291X.md
├── Actividad_DesarrolloAppMovil_53945291X.md
└── README.md
```

---

## 🎓 Contexto académico

| Campo     | Valor                                                 |
| --------- | ----------------------------------------------------- |
| Módulo    | PMDM — Programación Multimedia y Dispositivos Móviles |
| Ciclo     | DAM2 · Desarrollo de Aplicaciones Multiplataforma     |
| Curso     | 2025 / 2026                                           |
| Centro    | IES                                                   |
| Actividad | 005 · Desarrollo de App Móvil (Podcast Mobile-First)  |

---

## 👤 Autor

**Luis Jahir Rodriguez Cedeño**
DNI: 53945291X · DAM2 2025/26

---

<div align="center">

_Built with ❤️ using Flask + Vanilla JS_

</div>
