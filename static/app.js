const state = {
  userId: null,
  userName: "",
  sessionId: null,
  activeScreen: "home",
  screensVisited: new Set(["home"]),
  playsCount: 0,
  favoritesCount: 0,
  episodes: [],
  favorites: new Set(),
};

const el = {
  sessionLabel: document.getElementById("sessionLabel"),
  userName: document.getElementById("userName"),
  userDni: document.getElementById("userDni"),
  btnRegister: document.getElementById("btnRegister"),
  tabs: document.querySelectorAll(".tab"),
  screens: {
    home: document.getElementById("screen-home"),
    explore: document.getElementById("screen-explore"),
    library: document.getElementById("screen-library"),
  },
  channelsList: document.getElementById("channelsList"),
  homeEpisodes: document.getElementById("homeEpisodes"),
  exploreEpisodes: document.getElementById("exploreEpisodes"),
  favoritesList: document.getElementById("favoritesList"),
  stats: document.getElementById("stats"),
  leaders: document.getElementById("leaders"),
  chips: document.querySelectorAll(".chips button"),
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "Error de API");
  }
  return data;
}

function setActiveScreen(screenName) {
  if (screenName === state.activeScreen) return;

  Object.entries(el.screens).forEach(([key, node]) => {
    node.classList.toggle("active", key === screenName);
  });

  el.tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.target === screenName);
  });

  state.activeScreen = screenName;
  state.screensVisited.add(screenName);
  logEvent("screen_view", { screen: screenName }).catch(() => {});
}

function episodeCard(episode, compact = false) {
  const isFav = state.favorites.has(episode.id);
  return `
    <div class="card">
      <h4>${episode.cover_emoji || "🎧"} ${episode.title}</h4>
      <p>${episode.channel_name} · ${episode.duration_min} min · ${episode.mood}</p>
      <div style="display:flex; gap:8px; margin-top:8px;">
        <button data-play="${episode.id}">▶ Reproducir</button>
        <button data-fav="${episode.id}">${isFav ? "💚" : "🤍"} Favorito</button>
        ${compact ? "" : `<button data-open="explore">Ver más</button>`}
      </div>
    </div>
  `;
}

function bindEpisodeActions(container) {
  container.querySelectorAll("button[data-play]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = Number(button.dataset.play);
      const episode = state.episodes.find((item) => item.id === id);
      if (!episode) return;
      state.playsCount += 1;
      el.sessionLabel.textContent = `Reproduciendo: ${episode.title}`;
      await logEvent("play_episode", { episodeId: id, title: episode.title, mood: episode.mood }, id);
    });
  });

  container.querySelectorAll("button[data-fav]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.userId) {
        el.sessionLabel.textContent = "Registra usuario para usar favoritos.";
        return;
      }
      const id = Number(button.dataset.fav);
      const result = await api("/api/favorites/toggle", {
        method: "POST",
        body: JSON.stringify({ userId: state.userId, episodeId: id }),
      });

      if (result.active) {
        state.favorites.add(id);
      } else {
        state.favorites.delete(id);
      }
      state.favoritesCount = state.favorites.size;
      await logEvent("favorite_toggle", { episodeId: id, active: result.active }, id);
      await refreshAllEpisodeViews();
      await refreshFavorites();
      await refreshStats();
    });
  });

  container.querySelectorAll("button[data-open]").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveScreen(button.dataset.open);
    });
  });
}

async function refreshChannels() {
  const data = await api("/api/channels");
  el.channelsList.innerHTML = data.channels
    .map(
      (ch) => `
      <div class="card">
        <h4>${ch.cover_emoji} ${ch.name}</h4>
        <p>${ch.category}</p>
        <p>${ch.description}</p>
      </div>
    `
    )
    .join("");
}

async function refreshEpisodes(mood = "") {
  const query = mood ? `?mood=${encodeURIComponent(mood)}` : "";
  const data = await api(`/api/episodes${query}`);
  state.episodes = data.episodes;

  const top = state.episodes.slice(0, 3);
  el.homeEpisodes.innerHTML = top.map((ep) => episodeCard(ep)).join("");
  el.exploreEpisodes.innerHTML = `
    <table>
      <thead><tr><th>Episodio</th><th>Canal</th><th>Duración</th><th>Acción</th></tr></thead>
      <tbody>
        ${state.episodes
          .map(
            (ep) => `<tr>
              <td>${ep.cover_emoji} ${ep.title}</td>
              <td>${ep.channel_name}</td>
              <td>${ep.duration_min} min</td>
              <td><button data-play="${ep.id}">▶</button> <button data-fav="${ep.id}">${state.favorites.has(ep.id) ? "💚" : "🤍"}</button></td>
            </tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;

  bindEpisodeActions(el.homeEpisodes);
  bindEpisodeActions(el.exploreEpisodes);
}

async function refreshFavorites() {
  if (!state.userId) {
    el.favoritesList.innerHTML = "<p>Registra usuario para ver biblioteca.</p>";
    return;
  }
  const data = await api(`/api/users/${state.userId}/favorites`);
  state.favorites = new Set(data.favorites.map((f) => f.id));
  state.favoritesCount = state.favorites.size;

  if (!data.favorites.length) {
    el.favoritesList.innerHTML = "<p>Sin favoritos aún.</p>";
    return;
  }
  el.favoritesList.innerHTML = data.favorites.map((ep) => episodeCard(ep, true)).join("");
  bindEpisodeActions(el.favoritesList);
}

async function refreshLeaders() {
  const data = await api("/api/leaderboard");
  if (!data.leaders.length) {
    el.leaders.innerHTML = "<p>Sin ranking todavía.</p>";
    return;
  }
  const rows = data.leaders
    .map((row) => `<tr><td>${row.name}</td><td>${row.sessions}</td><td>${row.plays}</td><td>${row.favorites}</td></tr>`)
    .join("");
  el.leaders.innerHTML = `<table><thead><tr><th>Usuario</th><th>Sesiones</th><th>Plays</th><th>Fav</th></tr></thead><tbody>${rows}</tbody></table>`;
}

async function refreshStats() {
  const data = await api("/api/stats");
  const s = data.stats;
  el.stats.innerHTML = `
    <div class="kpi"><strong>Usuarios</strong><span>${s.users}</span></div>
    <div class="kpi"><strong>Canales</strong><span>${s.channels}</span></div>
    <div class="kpi"><strong>Episodios</strong><span>${s.episodes}</span></div>
    <div class="kpi"><strong>Sesiones</strong><span>${s.sessions}</span></div>
    <div class="kpi"><strong>Eventos</strong><span>${s.events}</span></div>
    <div class="kpi"><strong>Favoritos</strong><span>${s.favorites}</span></div>
  `;
}

async function refreshAllEpisodeViews() {
  await refreshEpisodes();
}

async function logEvent(eventType, payload = {}, episodeId = null) {
  if (!state.sessionId) return;
  await api("/api/events", {
    method: "POST",
    body: JSON.stringify({
      sessionId: state.sessionId,
      eventType,
      episodeId,
      screenName: state.activeScreen,
      payload,
    }),
  });
}

async function registerUser() {
  const name = el.userName.value.trim();
  const dni = el.userDni.value.trim();

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
  el.sessionLabel.textContent = `Sesión activa: ${user.name}`;

  await refreshFavorites();
  await refreshLeaders();
  await refreshStats();
}

async function closeSession() {
  if (!state.sessionId) return;
  await api("/api/sessions/end", {
    method: "POST",
    body: JSON.stringify({
      sessionId: state.sessionId,
      screensVisited: state.screensVisited.size,
      playsCount: state.playsCount,
      favoritesCount: state.favoritesCount,
    }),
  });
  state.sessionId = null;
}

function wireEvents() {
  el.tabs.forEach((tab) => {
    tab.addEventListener("click", () => setActiveScreen(tab.dataset.target));
  });

  el.btnRegister.addEventListener("click", () => {
    registerUser().catch((error) => {
      el.sessionLabel.textContent = `Error registro: ${error.message}`;
    });
  });

  el.chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      refreshEpisodes(chip.dataset.mood).catch(() => {});
    });
  });

  window.addEventListener("beforeunload", () => {
    if (!state.sessionId) return;
    const payload = JSON.stringify({
      sessionId: state.sessionId,
      screensVisited: state.screensVisited.size,
      playsCount: state.playsCount,
      favoritesCount: state.favoritesCount,
    });
    navigator.sendBeacon("/api/sessions/end", payload);
  });
}

async function boot() {
  wireEvents();
  await refreshChannels();
  await refreshEpisodes();
  await refreshFavorites();
  await refreshLeaders();
  await refreshStats();
}

boot().catch((error) => {
  el.sessionLabel.textContent = `Error init: ${error.message}`;
});
