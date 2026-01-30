import { mountLevelsUI } from "./ui/uiLevels.js";
import { mountUI } from "./ui/ui.js";
import { loadProgress } from "./api/loadProgress.js";
import { createGame } from "./game/game.js";
import { initPi } from "./pi/piInit.js";
import { ensurePiLogin } from "./pi/piClient.js";
import { levels } from "./levels/index.js";

let CURRENT_USER = null;
let CURRENT_ACCESS_TOKEN = null;
const BACKEND = "https://triumphant-gentleness-production.up.railway.app/";
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
}

async function loadMeAndSyncUI({ BACKEND, token, ui }) {
    
  const res = await fetch(`${BACKEND}/api/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return;

  const me = await res.json();
  alert("loadMeAndSyncUI EXECUTED ✅");

  const serverUser = me.user;

  CURRENT_USER = {
    uid: serverUser.uid,
    username: serverUser.username,
  };

  ui.setUser(CURRENT_USER);
  ui.setCoins(serverUser.coins);
    return me; // 🔥 THIS IS THE FIX
}
async function boot() {
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
} else {
  CURRENT_USER = null;
  CURRENT_ACCESS_TOKEN = null;
}

  // Mount UI
const ui = mountUI(root);
const levelsUI = mountLevelsUI(root);  
ui.levelsBtn.addEventListener("click", () => {
  levelsUI.open();
});
  
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
if (CURRENT_ACCESS_TOKEN) {
  const me = await loadMeAndSyncUI({
    BACKEND,
    token: CURRENT_ACCESS_TOKEN,
    ui,
  });

  if (me && me.user) {
    // ✅ AUTH CONFIRMED
    document.body.classList.add("game-running");
    ui.hideWelcome();

    const maxLevel =
      me?.progress?.maxLevel ??
      me?.progress?.highestLevel ??
      1;

    levelsUI.setUnlocked?.(maxLevel);
    game.start();
    return;
  }

  // ❌ TOKEN INVALID → RESET
  CURRENT_USER = null;
  CURRENT_ACCESS_TOKEN = null;
  localStorage.removeItem("pi_user");
  localStorage.removeItem("pi_token");
}

  // ---- GUEST ----
  ui.onGuestStart(() => {
  CURRENT_USER = { username: "Guest", uid: null };
  CURRENT_ACCESS_TOKEN = null;

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

        localStorage.setItem("pi_user", JSON.stringify(user));
        localStorage.setItem("pi_token", accessToken);
      },
    });

    const me = await loadMeAndSyncUI({
      BACKEND,
      token: CURRENT_ACCESS_TOKEN,
      ui,
    });

    if (!me?.user) throw new Error("Auth failed");

    const maxLevel =
      me?.progress?.maxLevel ??
      me?.progress?.highestLevel ??
      1;

    levelsUI.setUnlocked?.(maxLevel);
    document.body.classList.add("game-running");
    ui.hideWelcome();
    game.start();

  } catch (err) {
    console.error("LOGIN FAILED", err);

    // 🔁 rollback
    CURRENT_USER = null;
    CURRENT_ACCESS_TOKEN = null;
    localStorage.clear();
    ui.showWelcome();
  }
});
}

boot();