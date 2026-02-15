# Actividad 005 · Desarrollo de aplicaciones móviles

**Alumno:** Luis Jahir Rodriguez Cedeño  
**DNI:** 53945291X  
**Curso:** DAM2 - Programación multimedia y en dispositivos móviles  
**Unidad:** 301-Actividades final de unidad - Segundo trimestre  
**Actividad:** 005-Desarrollo de aplicaciones móviles

## 1) Base de clase respetada
Se parte del modelo trabajado en clase de app móvil web tipo Spotify:
- múltiples pantallas,
- navegación inferior,
- carga dinámica de listados,
- estructura de componentes.

Además, se conserva y amplía el enfoque de “framework” para cambio de pantalla con animación.

## 2) Modificaciones estéticas y visuales (alto impacto)
- Rediseño integral mobile-first centrado en smartphone.
- Sistema de pantallas con transición animada (`opacity + transform`).
- Tab bar fija inferior estilo app nativa.
- Tarjetas de canal/episodio y paneles de métricas adaptados a móvil.

## 3) Modificaciones funcionales (alto calado, segundo curso)
La demo frontend de clase se convierte en una solución full-stack:

### Backend y base de datos
- Flask + SQLite con tablas:
  - `mobile_users`
  - `channels`
  - `episodes`
  - `app_sessions`
  - `user_favorites`
  - `app_events`

### Funcionalidad implementada
- Registro de usuario con sesión persistente.
- Catálogo de canales y episodios filtrable por mood.
- Favoritos por usuario con persistencia relacional.
- Telemetría de interacción: plays, favoritos, pantallas visitadas y eventos de navegación.
- Cierre de sesión con consolidación de métricas.
- Leaderboard y estadísticas agregadas de uso.

Estas ampliaciones justifican el calado funcional exigido para segundo curso.

## 4) Cobertura de la rúbrica (4 puntos)
1. Respeto de la base temática y técnica vista en clase.
2. Cambios estéticos relevantes y orientados a UX móvil.
3. Cambios funcionales importantes con API y base de datos.
4. Entrega completa, ejecutable y documentada.

## 5) Ejecución
```bash
pip install -r requirements.txt
python app.py
```
URL: `http://127.0.0.1:5090`
