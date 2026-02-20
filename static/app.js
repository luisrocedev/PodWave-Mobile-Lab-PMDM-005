/* ══════════════════════════════════════════════════════
   PodWave Mobile Lab — Enhanced Frontend (14 mejoras)
   ══════════════════════════════════════════════════════ */

const state = {
  userId: null,
  userName: '',
  sessionId: null,
  activeScreen: 'home',
  screensVisited: new Set(['home']),
  playsCount: 0,
  favoritesCount: 0,
  episodes: [],
  favorites: new Set(),
  playing: null,      // { id, title, channel, emoji, duration }
  isPlaying: false,
  progressTimer: null,
  progressPct: 0,
  activeMood: '',
  searchQuery: '',
};

/* ── DOM refs ──────────────────────────────────────── */
const el = {
  sessionLabel:    document.getElementById('sessionLabel'),
  statusDot:       document.getElementById('statusDot'),
  userName:        document.getElementById('userName'),
  userDni:         document.getElementById('userDni'),
  btnRegister:     document.getElementById('btnRegister'),
  btnTheme:        document.getElementById('btnTheme'),
  tabs:            document.querySelectorAll('.tab'),
  screens: {
    home:    document.getElementById('screen-home'),
    explore: document.getElementById('screen-explore'),
    library: document.getElementById('screen-library'),
  },
  channelsList:    document.getElementById('channelsList'),
  homeEpisodes:    document.getElementById('homeEpisodes'),
  exploreEpisodes: document.getElementById('exploreEpisodes'),
  favoritesList:   document.getElementById('favoritesList'),
  stats:           document.getElementById('stats'),
  leaders:         document.getElementById('leaders'),
  moodChips:       document.querySelectorAll('#moodChips button'),
  searchInput:     document.getElementById('searchInput'),
  miniPlayer:      document.getElementById('miniPlayer'),
  playerTitle:     document.getElementById('playerTitle'),
  playerChannel:   document.getElementById('playerChannel'),
  playerEmoji:     document.getElementById('playerEmoji'),
  progressBar:     document.getElementById('progressBar'),
  btnPlayPause:    document.getElementById('btnPlayPause'),
  btnClosePlayer:  document.getElementById('btnClosePlayer'),
  badgeExplore:    document.getElementById('badgeExplore'),
  badgeLibrary:    document.getElementById('badgeLibrary'),
  btnSeed:         document.getElementById('btnSeed'),
  btnExport:       document.getElementById('btnExport'),
  btnImport:       document.getElementById('btnImport'),
  importFile:      document.getElementById('importFile'),
};

/* ── API helper ────────────────────────────────────── */
async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) throw new Error(data.error || 'Error de API');
  return data;
}

/* ── Toast ─────────────────────────────────────────── */
function showToast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  c.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 2800);
}

/* ── Theme toggle ──────────────────────────────────── */
function applyTheme(light) {
  document.body.classList.toggle('theme-light', light);
  el.btnTheme.textContent = light ? '\u2600\uFE0F' : '\uD83C\uDF19';
  localStorage.setItem('podwave-theme', light ? 'light' : 'dark');
}
function toggleTheme() {
  applyTheme(!document.body.classList.contains('theme-light'));
}
function initTheme() {
  const saved = localStorage.getItem('podwave-theme');
  if (saved === 'light') applyTheme(true);
}

/* ── Screen navigation ─────────────────────────────── */
const SCREEN_ORDER = ['home', 'explore', 'library'];

function setActiveScreen(name) {
  if (name === state.activeScreen) return;
  Object.entries(el.screens).forEach(([key, node]) => {
    node.classList.toggle('active', key === name);
  });
  el.tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.target === name));
  state.activeScreen = name;
  state.screensVisited.add(name);
  logEvent('screen_view', { screen: name }).catch(() => {});
  if (name === 'library') { refreshFavorites(); refreshLeaders(); refreshStats(); }
}

/* ── Swipe navigation ──────────────────────────────── */
let touchStartX = 0;
function initSwipe() {
  const main = document.getElementById('screens');
  main.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  main.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) < 60) return;
    const idx = SCREEN_ORDER.indexOf(state.activeScreen);
    if (dx < 0 && idx < SCREEN_ORDER.length - 1) setActiveScreen(SCREEN_ORDER[idx + 1]);
    if (dx > 0 && idx > 0) setActiveScreen(SCREEN_ORDER[idx - 1]);
  }, { passive: true });
}

/* ── Episode card ──────────────────────────────────── */
function episodeCard(ep, compact) {
  const isFav = state.favorites.has(ep.id);
  return `<div class="card">
    <h4>${ep.cover_emoji || '\uD83C\uDFA7'} ${ep.title}</h4>
    <p>${ep.channel_name} \u00B7 ${ep.duration_min} min \u00B7 ${ep.mood}</p>
    <div class="row">
      <button data-play="${ep.id}">\u25B6 Reproducir</button>
      <button data-fav="${ep.id}">${isFav ? '\uD83D\uDC9A' : '\uD83E\uDD0D'} Favorito</button>
      ${compact ? '' : '<button data-open="explore">Ver m\u00E1s</button>'}
    </div>
  </div>`;
}

function bindEpisodeActions(container) {
  container.querySelectorAll('button[data-play]').forEach(btn => {
    btn.addEventListener('click', () => {
      const ep = state.episodes.find(e => e.id === Number(btn.dataset.play));
      if (!ep) return;
      playEpisode(ep);
    });
  });
  container.querySelectorAll('button[data-fav]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!state.userId) { showToast('Registra usuario primero', 'warning'); return; }
      const id = Number(btn.dataset.fav);
      const res = await api('/api/favorites/toggle', { method: 'POST', body: JSON.stringify({ userId: state.userId, episodeId: id }) });
      if (res.active) state.favorites.add(id); else state.favorites.delete(id);
      state.favoritesCount = state.favorites.size;
      updateBadges();
      await logEvent('favorite_toggle', { episodeId: id, active: res.active }, id);
      showToast(res.active ? 'Agregado a favoritos' : 'Eliminado de favoritos', res.active ? 'ok' : 'info');
      await refreshAllViews();
    });
  });
  container.querySelectorAll('button[data-open]').forEach(btn => {
    btn.addEventListener('click', () => setActiveScreen(btn.dataset.open));
  });
}

/* ── Refresh functions ─────────────────────────────── */
async function refreshChannels() {
  const data = await api('/api/channels');
  el.channelsList.innerHTML = data.channels.map(ch =>
    `<div class="card"><h4>${ch.cover_emoji} ${ch.name}</h4><p>${ch.category} \u00B7 ${ch.description}</p></div>`
  ).join('');
}

async function refreshEpisodes(mood, search) {
  mood = mood !== undefined ? mood : state.activeMood;
  search = search !== undefined ? search : state.searchQuery;
  const query = mood ? `?mood=${encodeURIComponent(mood)}` : '';
  const data = await api(`/api/episodes${query}`);
  let eps = data.episodes;

  // Client-side search filter
  if (search) {
    const q = search.toLowerCase();
    eps = eps.filter(e => e.title.toLowerCase().includes(q) || e.channel_name.toLowerCase().includes(q) || e.mood.toLowerCase().includes(q));
  }
  state.episodes = eps;

  // Home top 3
  const top = eps.slice(0, 3);
  el.homeEpisodes.innerHTML = top.length ? top.map(e => episodeCard(e, false)).join('') : emptyState('\uD83C\uDFA7', 'No hay episodios');
  bindEpisodeActions(el.homeEpisodes);

  // Explore table
  if (!eps.length) {
    el.exploreEpisodes.innerHTML = emptyState('\uD83D\uDD0E', 'Sin resultados');
    return;
  }
  el.exploreEpisodes.innerHTML = `<table>
    <thead><tr><th>Episodio</th><th>Canal</th><th>Dur.</th><th>Mood</th><th></th></tr></thead>
    <tbody>${eps.map(ep => `<tr>
      <td>${ep.cover_emoji} ${ep.title}</td>
      <td>${ep.channel_name}</td>
      <td>${ep.duration_min}m</td>
      <td>${ep.mood}</td>
      <td><button data-play="${ep.id}">\u25B6</button> <button data-fav="${ep.id}">${state.favorites.has(ep.id) ? '\uD83D\uDC9A' : '\uD83E\uDD0D'}</button></td>
    </tr>`).join('')}</tbody></table>`;
  bindEpisodeActions(el.exploreEpisodes);
  updateBadges();
}

async function refreshFavorites() {
  if (!state.userId) { el.favoritesList.innerHTML = emptyState('\uD83D\uDCDA', 'Registra usuario para ver biblioteca.'); return; }
  const data = await api(`/api/users/${state.userId}/favorites`);
  state.favorites = new Set(data.favorites.map(f => f.id));
  state.favoritesCount = state.favorites.size;
  updateBadges();
  if (!data.favorites.length) { el.favoritesList.innerHTML = emptyState('\u2764\uFE0F', 'Sin favoritos aun.'); return; }
  el.favoritesList.innerHTML = data.favorites.map(e => episodeCard(e, true)).join('');
  bindEpisodeActions(el.favoritesList);
}

async function refreshLeaders() {
  const data = await api('/api/leaderboard');
  if (!data.leaders.length) { el.leaders.innerHTML = emptyState('\uD83C\uDFC6', 'Sin ranking todavia.'); return; }
  el.leaders.innerHTML = `<table><thead><tr><th></th><th>Usuario</th><th>Sesiones</th><th>Plays</th><th>Fav</th></tr></thead>
    <tbody>${data.leaders.map((r, i) => {
      const cls = i < 3 ? `rank-${i+1}` : 'rank-other';
      return `<tr><td><span class="rank-badge ${cls}">${i+1}</span></td><td>${r.name}</td><td>${r.sessions}</td><td>${r.plays}</td><td>${r.favorites}</td></tr>`;
    }).join('')}</tbody></table>`;
}

async function refreshStats() {
  const data = await api('/api/stats');
  const s = data.stats;
  el.stats.innerHTML = `
    <div class="kpi"><strong>Usuarios</strong><span>${s.users}</span></div>
    <div class="kpi"><strong>Canales</strong><span>${s.channels}</span></div>
    <div class="kpi"><strong>Episodios</strong><span>${s.episodes}</span></div>
    <div class="kpi"><strong>Sesiones</strong><span>${s.sessions}</span></div>
    <div class="kpi"><strong>Eventos</strong><span>${s.events}</span></div>
    <div class="kpi"><strong>Favoritos</strong><span>${s.favorites}</span></div>`;
}

async function refreshAllViews() {
  await refreshEpisodes();
  await refreshFavorites();
}

/* ── Empty state helper ────────────────────────────── */
function emptyState(icon, text) {
  return `<div class="empty-state"><div class="icon">${icon}</div><p>${text}</p></div>`;
}

/* ── Badge counts ──────────────────────────────────── */
function updateBadges() {
  const epCount = state.episodes.length;
  if (epCount > 0) { el.badgeExplore.textContent = epCount; el.badgeExplore.style.display = ''; }
  else { el.badgeExplore.style.display = 'none'; }
  if (state.favoritesCount > 0) { el.badgeLibrary.textContent = state.favoritesCount; el.badgeLibrary.style.display = ''; }
  else { el.badgeLibrary.style.display = 'none'; }
}

/* ── Mini-player ───────────────────────────────────── */
function playEpisode(ep) {
  state.playing = { id: ep.id, title: ep.title, channel: ep.channel_name, emoji: ep.cover_emoji || '\uD83C\uDFA7', duration: ep.duration_min * 60 };
  state.isPlaying = true;
  state.playsCount += 1;
  state.progressPct = 0;

  el.playerTitle.textContent = ep.title;
  el.playerChannel.textContent = ep.channel_name;
  el.playerEmoji.textContent = ep.cover_emoji || '\uD83C\uDFA7';
  el.btnPlayPause.textContent = '\u23F8\uFE0F';
  el.miniPlayer.classList.add('active');
  el.sessionLabel.textContent = `\u25B6 ${ep.title}`;

  startProgress();
  logEvent('play_episode', { episodeId: ep.id, title: ep.title, mood: ep.mood }, ep.id);
  showToast(`Reproduciendo: ${ep.title}`, 'ok');
}

function togglePlayPause() {
  if (!state.playing) return;
  state.isPlaying = !state.isPlaying;
  el.btnPlayPause.textContent = state.isPlaying ? '\u23F8\uFE0F' : '\u25B6\uFE0F';
  if (state.isPlaying) startProgress(); else stopProgress();
}

function closePlayer() {
  state.playing = null;
  state.isPlaying = false;
  stopProgress();
  state.progressPct = 0;
  el.progressBar.style.width = '0%';
  el.miniPlayer.classList.remove('active');
  el.sessionLabel.textContent = state.userId ? `Sesion: ${state.userName}` : 'Sin sesion';
}

function startProgress() {
  stopProgress();
  state.progressTimer = setInterval(() => {
    if (!state.playing) { stopProgress(); return; }
    state.progressPct += (1 / state.playing.duration) * 100;
    if (state.progressPct >= 100) { state.progressPct = 100; stopProgress(); showToast('Episodio completado', 'ok'); }
    el.progressBar.style.width = `${state.progressPct}%`;
  }, 1000);
}
function stopProgress() { clearInterval(state.progressTimer); state.progressTimer = null; }

/* ── Event logging ─────────────────────────────────── */
async function logEvent(eventType, payload = {}, episodeId = null) {
  if (!state.sessionId) return;
  await api('/api/events', { method: 'POST', body: JSON.stringify({ sessionId: state.sessionId, eventType, episodeId, screenName: state.activeScreen, payload }) });
}

/* ── User register ─────────────────────────────────── */
async function registerUser() {
  const name = el.userName.value.trim();
  const dni = el.userDni.value.trim();
  if (!name || !dni) { showToast('Nombre y DNI obligatorios', 'warning'); return; }
  const user = await api('/api/users/register', { method: 'POST', body: JSON.stringify({ name, dni }) });
  state.userId = user.userId;
  state.userName = user.name;
  const session = await api('/api/sessions/start', { method: 'POST', body: JSON.stringify({ userId: state.userId }) });
  state.sessionId = session.sessionId;
  el.sessionLabel.textContent = `Sesion: ${user.name}`;
  el.statusDot.classList.add('active');
  showToast(`Bienvenido, ${user.name}!`, 'ok');
  await refreshFavorites();
  await refreshLeaders();
  await refreshStats();
  updateBadges();
}

async function closeSession() {
  if (!state.sessionId) return;
  await api('/api/sessions/end', { method: 'POST', body: JSON.stringify({ sessionId: state.sessionId, screensVisited: state.screensVisited.size, playsCount: state.playsCount, favoritesCount: state.favoritesCount }) });
  state.sessionId = null;
}

/* ── Seed / Export / Import ────────────────────────── */
async function seedData() {
  const names = ['Ana Garcia', 'Carlos Lopez', 'Maria Fernandez'];
  for (const name of names) {
    try {
      const u = await api('/api/users/register', { method: 'POST', body: JSON.stringify({ name, dni: '00000000X' }) });
      await api('/api/sessions/start', { method: 'POST', body: JSON.stringify({ userId: u.userId }) });
    } catch(_) {}
  }
  showToast('Datos de prueba insertados', 'ok');
  await refreshLeaders();
  await refreshStats();
}

async function exportData() {
  try {
    const [leaders, stats, episodes] = await Promise.all([api('/api/leaderboard'), api('/api/stats'), api('/api/episodes')]);
    const blob = new Blob([JSON.stringify({ leaders: leaders.leaders, stats: stats.stats, episodes: episodes.episodes }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'podwave_export.json'; a.click();
    URL.revokeObjectURL(url);
    showToast('Datos exportados', 'ok');
  } catch(e) { showToast('Error exportando: ' + e.message, 'danger'); }
}

function importData() { el.importFile.click(); }

function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.leaders) {
        el.leaders.innerHTML = `<table><thead><tr><th></th><th>Usuario</th><th>Sesiones</th><th>Plays</th><th>Fav</th></tr></thead>
          <tbody>${data.leaders.map((r,i) => {
            const cls = i < 3 ? `rank-${i+1}` : 'rank-other';
            return `<tr><td><span class="rank-badge ${cls}">${i+1}</span></td><td>${r.name}</td><td>${r.sessions}</td><td>${r.plays}</td><td>${r.favorites}</td></tr>`;
          }).join('')}</tbody></table>`;
      }
      if (data.stats) {
        const s = data.stats;
        el.stats.innerHTML = Object.entries(s).map(([k,v]) => `<div class="kpi"><strong>${k}</strong><span>${v}</span></div>`).join('');
      }
      showToast('Datos importados correctamente', 'ok');
    } catch(_) { showToast('JSON no valido', 'danger'); }
  };
  reader.readAsText(file);
  el.importFile.value = '';
}

/* ── Keyboard shortcuts ────────────────────────────── */
function initKeyboard() {
  document.addEventListener('keydown', ev => {
    if (ev.target.closest('input, textarea')) return;
    if (ev.key === '1') setActiveScreen('home');
    if (ev.key === '2') setActiveScreen('explore');
    if (ev.key === '3') setActiveScreen('library');
    if (ev.key === ' ') { ev.preventDefault(); togglePlayPause(); }
    if (ev.key === 'Escape') closePlayer();
  });
}

/* ── Wire all events ───────────────────────────────── */
function wireEvents() {
  // Tabs
  el.tabs.forEach(tab => tab.addEventListener('click', () => setActiveScreen(tab.dataset.target)));

  // Register
  el.btnRegister.addEventListener('click', () => registerUser().catch(e => { el.sessionLabel.textContent = `Error: ${e.message}`; showToast(e.message, 'danger'); }));

  // Theme
  el.btnTheme.addEventListener('click', toggleTheme);

  // Mood chips
  el.moodChips.forEach(chip => {
    chip.addEventListener('click', () => {
      el.moodChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.activeMood = chip.dataset.mood;
      refreshEpisodes(state.activeMood, state.searchQuery);
    });
  });

  // Search
  let searchTimer;
  el.searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.searchQuery = el.searchInput.value.trim();
      refreshEpisodes(state.activeMood, state.searchQuery);
    }, 250);
  });

  // Player
  el.btnPlayPause.addEventListener('click', togglePlayPause);
  el.btnClosePlayer.addEventListener('click', closePlayer);

  // Seed / Export / Import
  el.btnSeed.addEventListener('click', seedData);
  el.btnExport.addEventListener('click', exportData);
  el.btnImport.addEventListener('click', importData);
  el.importFile.addEventListener('change', handleImportFile);

  // Beforeunload
  window.addEventListener('beforeunload', () => {
    if (!state.sessionId) return;
    navigator.sendBeacon('/api/sessions/end', JSON.stringify({
      sessionId: state.sessionId,
      screensVisited: state.screensVisited.size,
      playsCount: state.playsCount,
      favoritesCount: state.favoritesCount,
    }));
  });
}

/* ── Boot ──────────────────────────────────────────── */
async function boot() {
  initTheme();
  initSwipe();
  initKeyboard();
  wireEvents();
  await refreshChannels();
  await refreshEpisodes();
  await refreshFavorites();
  await refreshLeaders();
  await refreshStats();
  updateBadges();
}

boot().catch(e => { el.sessionLabel.textContent = `Error init: ${e.message}`; });
