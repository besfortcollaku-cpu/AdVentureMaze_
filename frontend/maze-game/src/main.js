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

  fetchAndSetCoins({
    BACKEND: import.meta.env.VITE_BACKEND_URL,
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
    await ensurePiLogin({
  BACKEND,
  ui,
  onLogin: ({ user, accessToken }) => {
    CURRENT_USER = user;
    CURRENT_ACCESS_TOKEN = accessToken;

    // 🔑 POPULATE COINS
    if (typeof user.coins === "number") {
      ui.setCoins(user.coins);

  localStorage.setItem("pi_user", JSON.stringify(user));
  localStorage.setItem("pi_token", accessToken);
}
    });
await fetchAndSetCoins({
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