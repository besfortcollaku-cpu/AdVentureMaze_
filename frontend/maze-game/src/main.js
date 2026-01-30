import "./style.css";
import { mountLevelsUI } from "./ui/uiLevels.js";
import { mountUI } from "./ui/ui.js";
import { loadProgress } from "./api/loadProgress.js";
import { createGame } from "./game/game.js";
import { ensurePiLogin } from "./pi/piClient.js";
import { levels } from "./levels/index.js";
const GUEST_PROGRESS_KEY = "guest_progress_v1";
const GUEST_MAX_LEVEL = 5;
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
function loadGuestProgress() {
  try {
    const raw = localStorage.getItem(GUEST_PROGRESS_KEY);
    if (!raw) return { maxLevel: 1 };
    return JSON.parse(raw);
  } catch {
    return { maxLevel: 1 };
  }
}

function saveGuestProgress(maxLevel) {
  const capped = Math.min(maxLevel, GUEST_MAX_LEVEL);
  localStorage.setItem(
    GUEST_PROGRESS_KEY,
    JSON.stringify({ maxLevel: capped })
  );
}
async function migrateGuestProgress({ BACKEND, token }) {
  const raw = localStorage.getItem(GUEST_PROGRESS_KEY);
  if (!raw) return;

  const data = JSON.parse(raw);

  await fetch(`${BACKEND}/api/progress/migrate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  localStorage.removeItem(GUEST_PROGRESS_KEY);
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

  // ---- GUEST ----
  ui.onGuestStart(() => {
  CURRENT_USER = { username: "Guest", uid: null };
  CURRENT_ACCESS_TOKEN = null;

  const guestProgress = loadGuestProgress();
  levelsUI.setUnlocked?.(
    Math.min(guestProgress.maxLevel, GUEST_MAX_LEVEL)
  );

  document.body.classList.add("game-running");
  ui.hideWelcome();
  game.start();
});

// ---- PI LOGIN ----
ui.onLoginClick(async () => {
  const result = await ensurePiLogin({
    BACKEND,
    ui,
    onLogin: ({ user, accessToken }) => {
      CURRENT_USER = user;
      CURRENT_ACCESS_TOKEN = accessToken;
    },
  });

  if (!result?.ok) return;
  await migrateGuestProgress({
  BACKEND,
  token: CURRENT_ACCESS_TOKEN,
});

  const me = await loadMeAndSyncUI({
    BACKEND,
    token: CURRENT_ACCESS_TOKEN,
    ui,
  });

  const maxLevel =
    me?.progress?.maxLevel ??
    me?.progress?.highestLevel ??
    1;

  levelsUI.setUnlocked?.(maxLevel);
  document.body.classList.add("game-running");
  ui.hideWelcome();
  game.start();
});
}

boot();