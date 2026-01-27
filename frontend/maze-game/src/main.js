import "./css/ui.css";
import { mountUI } from "./ui/ui.js";
import { createGame } from "./game/game.js";
import { initPi } from "./pi/piInit.js";
import { ensurePiLogin } from "./pi/piClient.js";
import { levels } from "./levels/index.js";

let CURRENT_USER = null;
let CURRENT_ACCESS_TOKEN = null;
const BACKEND = "https://adventuremaze.onrender.com";
async function fetchAndSetCoins({ BACKEND, token, ui }) {
  if (!token) return;

  const res = await fetch(`${BACKEND}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) return;

  const data = await res.json();
  ui.setCoins(data.coins ?? 0);
}
async function loadCoins({ BACKEND, token, ui }) {
  const res = await fetch(`${BACKEND}/api/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) return;

  const data = await res.json();

  if (typeof data?.user?.coins === "number") {
    ui.setCoins(data.user.coins);
  }
}
async function loadMeAndSyncUI({ BACKEND, token, ui }) {
  const res = await fetch(`${BACKEND}/api/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return;

  const me = await res.json();

  const serverUser = me.user;

  CURRENT_USER = {
    uid: serverUser.uid,
    username: serverUser.username,
  };

  ui.setUser(CURRENT_USER);
  ui.setCoins(serverUser.coins);
}
function boot() {
  const root = document.querySelector("#app");
  if (!root) {
    document.body.innerHTML = "<h1>#app not found</h1>";
    return;
  }

  // iOS hard lock
  document.body.style.position = "fixed";
  document.body.style.width = "100%";
  document.body.style.height = "100%";
  document.addEventListener(
    "touchmove",
    (e) => e.preventDefault(),
    { passive: false }
  );
  
  const savedUser = localStorage.getItem("pi_user");
const savedToken = localStorage.getItem("pi_token");

if (savedUser && savedToken) {
  CURRENT_USER = JSON.parse(savedUser);
  CURRENT_ACCESS_TOKEN = savedToken;
}

  // Mount UI
  const ui = mountUI(root);
  
  ui.showWelcome();

  // Init Pi SDK
  initPi();

  // Create game (DO NOT START)
  const game = createGame({
    canvas: ui.canvas,
    level: levels[0],
    getCurrentUser: () => CURRENT_USER ?? { username: "guest", uid: null },
    onLevelComplete() {},
  });
if (CURRENT_USER && CURRENT_ACCESS_TOKEN) {
  document.body.classList.add("game-running");
  ui.hideWelcome();

  loadCoins({
    BACKEND,
    token: CURRENT_ACCESS_TOKEN,
    ui,
  });

  game.start();
  return;
}

  // ---- GUEST ----
  ui.onGuestStart(() => {
    document.body.classList.remove("welcome-visible");
    document.body.classList.add("game-running");
    ui.hideWelcome();
    game.start();
  });

// ---- PI LOGIN ----
ui.onLoginClick(async () => {
  try {
    const BACKEND = import.meta.env.VITE_BACKEND_URL;

    await ensurePiLogin({
  BACKEND,
  ui,
  onLogin: ({ user, accessToken }) => {
    CURRENT_ACCESS_TOKEN = accessToken;
  },
});
await loadMeAndSyncUI({
  BACKEND,
  token: CURRENT_ACCESS_TOKEN,
  ui,
});


    document.body.classList.remove("welcome-visible");
    document.body.classList.add("game-running");
    ui.hideWelcome();
    game.start();

  } catch (err) {
    console.error("PI LOGIN FAILED", err);
  }
});
}

boot();