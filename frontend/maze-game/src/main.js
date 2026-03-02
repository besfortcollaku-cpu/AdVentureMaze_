console.log("BUILD VERSION TEST 123");
import "./css/ui.css";
import "./css/ads.css";
import { mountLevelsUI } from "./ui/uiLevels.js";
import { mountUI } from "./ui/ui.js";
import { loadProgress } from "./api/loadProgress.js";
import { createGame } from "./game/game.js";
import { ensurePiLogin } from "./pi/piClient.js";
import { levels } from "./levels/index.js";
import { createWinPopup } from "./ui/uiWin.js";
import { createSkipPopup } from "./ui/uiSkip.js";
import { createHintPopup } from "./ui/uiHints.js";
import { createRestartPopup } from "./ui/uiRestarts.js";

const GUEST_PROGRESS_KEY = "guest_progress_v1";
const GUEST_MAX_LEVEL = 5;
let CURRENT_USER = null;

Object.defineProperty(window, "__DEBUG_USER", {
  get() {
    return CURRENT_USER;
  }
});
let CURRENT_ACCESS_TOKEN = null;
let ui = null;
const BACKEND = "https://triumphant-gentleness-production.up.railway.app";
const FREE_SKIPS = 3;
const FREE_HINTS = 3;
const FREE_RESTARTS = 3;


document.addEventListener(
  "touchmove",
  (e) => {
    if (document.body.classList.contains("welcome-visible")) return;
    e.preventDefault();
  },
  { passive: false }
);

let levelIndex = 0;
let RESUME_ENABLED = false;
let RESUME_TILES = new Set();
let RESUME_POS = null;
let RESUME_SAVE_TIMER = null;
let LEVEL_START_KEY = null;

function normalizeToken(t) {
  return String(t || "").replace(/^Bearer\s+/i, "");
}
function applyUserPatch(patch) {
  if (!patch) return;

  const keepUid = CURRENT_USER?.uid;
  const keepName = CURRENT_USER?.username;

  CURRENT_USER = { ...CURRENT_USER, ...patch };

  // never allow identity to be wiped by partial backend patches
  if (!CURRENT_USER?.uid && keepUid) CURRENT_USER.uid = keepUid;
  if (!CURRENT_USER?.username && keepName) CURRENT_USER.username = keepName;

  // update header
  ui?.setUser?.(CURRENT_USER);
  ui?.setCoins?.(CURRENT_USER?.coins ?? 0);

  // 🔥 CRITICAL: refresh badges from DB values
  updateAllBadges();
}
function scheduleResumeSave(currentLevelNumber) {
  if (!CURRENT_ACCESS_TOKEN) return;
  if (!RESUME_ENABLED) return;
  if (RESUME_SAVE_TIMER) return;

  RESUME_SAVE_TIMER = setTimeout(() => {
    RESUME_SAVE_TIMER = null;

    const safeLevel = Math.max(
      Number(CURRENT_MAX_UNLOCKED_LEVEL || 1),
      Number(currentLevelNumber || 1)
    );
if (LEVEL_START_KEY) {
  RESUME_TILES.add(LEVEL_START_KEY);
}
    console.log(
      "SAVING RESUME",
      safeLevel,
      RESUME_TILES.size,
      RESUME_POS
    );
    
    if (!CURRENT_USER?.uid) return;

apiSetProgress({
  uid: CURRENT_USER.uid,
      level: safeLevel,
      coins: CURRENT_USER?.coins ?? 0,
      paintedKeys: Array.from(RESUME_TILES),
      resume: RESUME_POS,
    }).catch(() => {});
  }, 700);
}
// Keep the Levels 1screen consistent (guest: localStorage, logged-in: backend)
let CURRENT_MAX_UNLOCKED_LEVEL = 1;

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

async function apiSetProgress({ uid, level, coins, paintedKeys, resume } = {}) {
    
if (!CURRENT_ACCESS_TOKEN || !CURRENT_USER?.uid) {
  console.warn("Skipping progress save — not authenticated");
  return null;
}
console.log("SET PROGRESS PAYLOAD", {
  uid,
  level,
  coins,
  paintedKeys,
  resume,
});

  const res = await fetch(`${BACKEND}/api/progress`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
    },
    body: JSON.stringify({
  uid,
  level,
  coins,
  paintedKeys: paintedKeys ?? [],
  resume: resume ?? null,
}),
  });

  // never break gameplay
  return res.json().catch(() => ({}));
}
async function apiClaimLevelComplete(levelNumber) {
  if (!CURRENT_ACCESS_TOKEN) return null;

  const res = await fetch(`${BACKEND}/api/rewards/level-complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
    },
    body: JSON.stringify({
      level: levelNumber,
    }),
  });

  if (!res.ok) {
    return null; // never break gameplay
  }

  return res.json();
}

function updateBadge({ badgeId, left }) {
  const badge = document.getElementById(badgeId);
  if (!badge) return;

  if (left > 0) {
    badge.textContent = left;
    badge.classList.remove("hidden");
  } else {
    badge.textContent = "";
    badge.classList.add("hidden");
  }
}


async function apiSkip({ mode }) {
  const nonce = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  const res = await fetch(`${BACKEND}/api/skip`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
    },
    body: JSON.stringify({ mode, nonce }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) throw new Error(data?.error || "Skip failed");
  return data;
}

async function apiHint({ mode }) {
  const nonce = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  const res = await fetch(`${BACKEND}/api/hint`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
    },
    body: JSON.stringify({ mode, nonce }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) throw new Error(data?.error || "Hint failed");
  return data;
}

async function apiClaimAd50() {
  if (!CURRENT_ACCESS_TOKEN) {
    throw new Error("No access token");
  }

  const res = await fetch(`${BACKEND}/api/rewards/ad-50`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
    },
    body: JSON.stringify({
      nonce: `${Date.now()}-${Math.random()}`,
    }),
  });

  if (!res.ok) {
    throw new Error("Ad reward failed");
  }

  return res.json();
}

async function loadMeAndSyncUI({ BACKEND, token, ui }) {
  const res = await fetch(`${BACKEND}/api/me`, {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${normalizeToken(token)}`,
    "Content-Type": "application/json"
  },
});

  if (!res.ok) {
  console.warn("Failed /api/me", res.status);
  return { user: CURRENT_USER, progress: null };
}

  const me = await res.json();

  const user = me?.user || {};
  const progress = me?.progress || {};

  CURRENT_USER = {
  ...user,
  ...progress,

  uid: user.uid,
  username: user.username,

  // normalize everything
  coins: Number(user.coins ?? progress.coins ?? 0),

  restarts_balance: Number(user.restarts_balance ?? 0),
  skips_balance: Number(user.skips_balance ?? 0),
  hints_balance: Number(user.hints_balance ?? 0),

  free_restarts_used: Number(progress.free_restarts_used ?? 0),
  free_skips_used: Number(progress.free_skips_used ?? 0),
  free_hints_used: Number(progress.free_hints_used ?? 0),
};
// 🔥 restore highest unlocked level from backend
CURRENT_MAX_UNLOCKED_LEVEL =
  Number(progress.level ?? CURRENT_MAX_UNLOCKED_LEVEL ?? 1);
  
  ui.setUser({
    ...CURRENT_USER,
    level: Number(progress.level || 1),
  });

  ui.setCoins(Number(user.coins ?? progress.coins ?? 0));
  
setTimeout(() => {
  updateAllBadges();
}, 0);
return me;
}

function updateAllBadges() {
  if (!CURRENT_USER) return;

  const FREE_SKIP_LIMIT = 3;
  const FREE_HINT_LIMIT = 3;
  const FREE_RESTART_LIMIT = 3;

  const freeSkipsLeft =
    FREE_SKIP_LIMIT - (CURRENT_USER.free_skips_used ?? 0);
  const freeHintsLeft =
    FREE_HINT_LIMIT - (CURRENT_USER.free_hints_used ?? 0);
  const freeRestartsLeft =
    FREE_RESTART_LIMIT - (CURRENT_USER.free_restarts_used ?? 0);

  const totalSkips =
    Math.max(0, freeSkipsLeft) +
    (CURRENT_USER.skips_balance ?? 0);

  const totalHints =
    Math.max(0, freeHintsLeft) +
    (CURRENT_USER.hints_balance ?? 0);

  const totalRestarts =
    Math.max(0, freeRestartsLeft) +
    (CURRENT_USER.restarts_balance ?? 0);

  ui?.setSkipsBadge?.(totalSkips);
  ui?.setHintsBadge?.(totalHints);
  ui?.setRestartsBadge?.(totalRestarts);
}


async function apiRestart({ mode }) {
  const nonce = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  const res = await fetch(`${BACKEND}/api/restart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
    },
    body: JSON.stringify({ mode, nonce }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) throw new Error(data?.error || "Restart failed");
  return data;
}
function freeRestartsLeft() {
  const used = Number(CURRENT_USER?.free_restarts_used || 0);
  return Math.max(0, FREE_RESTARTS - used);
}
function freeSkipsLeft() {
  const used = Number(CURRENT_USER?.free_skips_used || 0);
  return Math.max(0, FREE_SKIPS - used);
}

function freeHintsLeft() {
  const used = Number(CURRENT_USER?.free_hints_used || 0);
  return Math.max(0, FREE_HINTS - used);
}
function loadGuestProgress() {
  try {
    const raw = localStorage.getItem(GUEST_PROGRESS_KEY);
    if (!raw) return { maxLevel: 1 };
    return JSON.parse(raw);
  } catch (e) {
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
      // 1. Initialize State
  const storedToken = localStorage.getItem("pi_access_token");
  if (storedToken) {
    CURRENT_ACCESS_TOKEN = normalizeToken(storedToken);
  }

  // 2. Define the UI Logic (Declare handlers before attaching)
  const startAuthenticatedSession = async () => {
    try {
      const me = await loadMeAndSyncUI({ BACKEND, token: CURRENT_ACCESS_TOKEN, ui });
      if (!me?.user) throw new Error("Invalid session");

      updateAllBadges();
      const unlockedLevel = me?.progress?.level ?? 1;
      CURRENT_MAX_UNLOCKED_LEVEL = Math.max(1, Number(unlockedLevel) || 1);
      
      setLevel(CURRENT_MAX_UNLOCKED_LEVEL - 1);
      RESUME_ENABLED = true;
      
      if (me?.progress?.paintedKeys || me?.progress?.resume) {
        RESUME_TILES = new Set(me.progress.paintedKeys || []);
        RESUME_POS = me.progress.resume || null;
        game.applyProgress({ paintedKeys: Array.from(RESUME_TILES), player: RESUME_POS });
      }

      document.body.classList.add("game-running");
      ui.hideWelcome();
      if (!game.isRunning?.()) game.start();
    } catch (e) {
      console.warn("Session failed:", e);
      localStorage.removeItem("pi_access_token");
      CURRENT_ACCESS_TOKEN = null;
      ui.showWelcome();
    }
  };

  // 3. ATTACH LISTENERS (The Fix)
  ui.onLoginClick(async () => {
    console.log("Login Clicked");
    const result = await ensurePiLogin({
      BACKEND,
      ui,
      onLogin: ({ accessToken }) => {
        CURRENT_ACCESS_TOKEN = normalizeToken(accessToken);
        localStorage.setItem("pi_access_token", CURRENT_ACCESS_TOKEN);
      }
    });

    if (CURRENT_ACCESS_TOKEN || result?.accessToken) {
      if (result?.accessToken) CURRENT_ACCESS_TOKEN = normalizeToken(result.accessToken);
      window.__maze.guestMaxLevel = Infinity;
      await startAuthenticatedSession();
    }
  });

  ui.onGuestStart(() => {
    console.log("Guest Clicked");
    localStorage.removeItem("pi_access_token");
    CURRENT_ACCESS_TOKEN = null;
    CURRENT_USER = null;
    RESUME_ENABLED = false;
    CURRENT_MAX_UNLOCKED_LEVEL = 1;
    document.body.classList.add("game-running");
    ui.hideWelcome();
    setLevel(0);
    game.start();
    updateAllBadges();
  });

  // 4. Final Initialization Check
  if (!CURRENT_ACCESS_TOKEN) {
    ui.showWelcome();
  } else {
    startAuthenticatedSession();
  }

  // Define Helper Functions used inside
  function setLevel(i) {
    levelIndex = Math.max(0, Math.min(levels.length - 1, i));
    ui.setLevel(levelIndex + 1);
    game.setLevel(levels[levelIndex]);
  }

  function goNextLevel() {
    setLevel(levelIndex + 1);
  }

  // (Ensure your popups and game logic remain defined within this scope)
}

boot();
