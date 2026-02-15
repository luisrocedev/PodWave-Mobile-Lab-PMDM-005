# PodWave Mobile Lab · PMDM Actividad 005

Aplicación móvil web `mobile-first` creada a partir de la base de clase tipo Spotify (pantallas, navegación por tabs y consumo de datos), ampliada con un framework de transición animada entre pantallas y backend Flask+SQLite.

## Stack
- Python + Flask
- SQLite
- HTML/CSS/JavaScript (mobile-first)

## Funcionalidades
- Navegación animada entre pantallas (Inicio, Explorar, Biblioteca).
- Registro de usuario y sesión móvil persistente.
- Catálogo de canales y episodios con filtros por mood.
- Reproducción simulada y gestión de favoritos.
- Telemetría de eventos (pantallas visitadas, plays, favoritos).
- Ranking de usuarios + panel de métricas en tiempo real.

## Ejecutar
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```
Abrir: `http://127.0.0.1:5090`

## Autor
- Luis Jahir Rodriguez Cedeño
- DNI: 53945291X
