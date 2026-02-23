
import "./css/ui.css";
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
let CURRENT_ACCESS_TOKEN = null;
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
  if (!CURRENT_ACCESS_TOKEN) return null;

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
      paintedKeys,
      resume,
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

  free_restarts_used: Number(user.free_restarts_used ?? 0),
  free_skips_used: Number(user.free_skips_used ?? 0),
  free_hints_used: Number(user.free_hints_used ?? 0),
};
  ui.setUser({
    ...CURRENT_USER,
    level: Number(progress.level || 1),
  });

  ui.setCoins(Number(user.coins ?? progress.coins ?? 0));

  return me;
}

function updateAllBadges() {
  if (!CURRENT_USER) return;
  if (!ui) return;

  const hintsLeft =
    Math.max(0, (typeof FREE_HINTS === "number" ? FREE_HINTS : 0) -
      Number(CURRENT_USER?.free_hints_used || 0));

  const skipsLeft =
    Math.max(0, (typeof FREE_SKIPS === "number" ? FREE_SKIPS : 0) -
      Number(CURRENT_USER?.free_skips_used || 0));

  const restartsLeft =
    Math.max(0, (typeof FREE_RESTARTS === "number" ? FREE_RESTARTS : 0) -
      Number(CURRENT_USER?.free_restarts_used || 0));

  ui?.setHintsBadge?.(hintsLeft);
  ui?.setSkipsBadge?.(skipsLeft);
  ui?.setRestartsBadge?.(restartsLeft);
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
    const storedToken = localStorage.getItem("pi_access_token");
if (storedToken) {
  CURRENT_ACCESS_TOKEN = normalizeToken(storedToken);
}
// 🔥 AUTO-HYDRATE USER IF TOKEN EXISTS

  const root = document.querySelector("#app");
  if (!root) {
    document.body.innerHTML = "<h1>#app not found</h1>";
    return;
  }
  // Mount UI
const ui = mountUI(root);
if (CURRENT_ACCESS_TOKEN) {
  try {
    const me = await loadMeAndSyncUI({
      BACKEND,
      token: CURRENT_ACCESS_TOKEN,
      ui,
    });

    if (me?.user) {
  // DO NOT overwrite CURRENT_USER again
  updateAllBadges();
} // 🔥 force correct badge state immediately
     else {
      throw new Error("Invalid session");
    }
  } catch (e) {
    console.warn("Token invalid during boot");
    CURRENT_ACCESS_TOKEN = null;
    CURRENT_USER = null;
    localStorage.removeItem("pi_access_token");
  }
}

// Expose a tiny bridge for UI modules that don't have direct access to `ui`.
// (Used by the Levels screen to show "Login required" for locked guest levels.)
window.__maze = window.__maze || {};
window.__maze.guestMaxLevel = GUEST_MAX_LEVEL;
window.__maze.showLoginRequired = () => ui.showLoginRequired();
window.__maze.isLoggedIn = () => Boolean(CURRENT_ACCESS_TOKEN);

const winPopup = createWinPopup();
const skipPopup = createSkipPopup();
const hintPopup = createHintPopup();
const restartPopup = createRestartPopup();





  function setLevel(i) {
    levelIndex = Math.max(0, Math.min(levels.length - 1, i));
    ui.setLevel(levelIndex + 1);
    game.setLevel(levels[levelIndex]);
  }

  function goNextLevel() {
    setLevel(levelIndex + 1);
  }

  // (level-complete reward is handled via global apiClaimLevelComplete)


const levelsUI = mountLevelsUI(root, { totalLevels: levels.length });  
ui.levelsBtn.addEventListener("click", () => {
  // keep levels UI in sync before opening
if (CURRENT_ACCESS_TOKEN) {
  // logged-in: NEVER apply guest cap
  levelsUI.setUnlocked?.(CURRENT_MAX_UNLOCKED_LEVEL || 1);
} else {
  const guestProgress = loadGuestProgress();
  const unlocked = Math.min(guestProgress.maxLevel || 1, GUEST_MAX_LEVEL);
  CURRENT_MAX_UNLOCKED_LEVEL = unlocked;
  levelsUI.setUnlocked?.(unlocked);
}

  levelsUI.open();
});

// Level select
levelsUI.onSelect((levelNumber) => {
  // Guest can only open levels 1..GUEST_MAX_LEVEL
  if (!CURRENT_ACCESS_TOKEN && levelNumber > GUEST_MAX_LEVEL) {
    ui.showLoginRequired();
    return;
  }
  goToLevel(levelNumber - 1);
});
  if (!CURRENT_ACCESS_TOKEN)
  ui.showWelcome();
  
ui.onRestartClick(async () => {
  if (!CURRENT_ACCESS_TOKEN) {
    ui.showLoginRequired();
    return;
  }

  const freeLeft = Math.max(
    0,
    FREE_RESTARTS - (CURRENT_USER.free_restarts_used || 0)
  );

  // 🟢 FREE RESTART → NO POPUP
  if (freeLeft > 0) {
    const out = await fetch(`${BACKEND}/api/restart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
      },
      body: JSON.stringify({ mode: "free" }),
    }).then(r => r.json());

    if (!out?.ok) return;

    applyUserPatch(out.user);
    wipeResumeForCurrentLevel();
    game.setLevel(levels[levelIndex]);
    updateAllBadges();
    return;
  }

  // 🔴 NO FREE → POPUP
  restartPopup.open({
    coins: CURRENT_USER?.coins ?? 0,
    freeLeft: 0,
  });
});
// Create game (DO NOT START)
const game = createGame({
  canvas: ui.canvas,
  level: levels[0],
  getCurrentUser: () => CURRENT_USER ?? { username: "guest", uid: null },

  onTilePainted({ key, x, y }) {
    if (!CURRENT_ACCESS_TOKEN) return;
    if (!RESUME_ENABLED) return;

    RESUME_TILES.add(key);
    RESUME_POS = { x, y };

    scheduleResumeSave(levelIndex + 1);
  },

  onLevelComplete({ level }) {
    RESUME_ENABLED = false;

    const completedLevel = level?.number ?? (levelIndex + 1);

    // ✅ server reward: +1 coin once per level
    if (CURRENT_ACCESS_TOKEN) {
      apiClaimLevelComplete(completedLevel)
        .then((out) => {
          if (out?.user) {
            applyUserPatch(out.user);
            ui.setCoins(out.user.coins ?? 0);
          }
        })
        .catch(() => {});
    }
    winPopup.show({
      levelNumber: completedLevel,
    });


    // ✅ logged-in: unlock next level in UI (old UNLOCKED_LEVEL behavior)
    // ✅ logged-in: unlock next level + SAVE progress (OLD LOGIC RESTORED)
if (CURRENT_ACCESS_TOKEN) {
  const nextUnlocked = Math.min(levels.length, completedLevel + 1);

  CURRENT_MAX_UNLOCKED_LEVEL = Math.max(
    CURRENT_MAX_UNLOCKED_LEVEL,
    nextUnlocked
  );

  setTimeout(() => levelsUI.setUnlocked?.(CURRENT_MAX_UNLOCKED_LEVEL), 0);

  // persist unlocked progress + CLEAR resume
  apiSetProgress({
      uid: CURRENT_USER.uid,
    level: nextUnlocked,
    coins: CURRENT_USER?.coins ?? 0,
    paintedKeys: [],
    resume: null,
  }).catch(() => {});
}
    // 🟡 guest progress is local-only (levels 1..GUEST_MAX_LEVEL)
    if (!CURRENT_ACCESS_TOKEN) {
      const nextUnlock = Math.min(GUEST_MAX_LEVEL, completedLevel + 1);
      const current = loadGuestProgress();
      const newMax = Math.min(
        GUEST_MAX_LEVEL,
        Math.max(current?.maxLevel || 1, nextUnlock)
      );
      saveGuestProgress(newMax);
      CURRENT_MAX_UNLOCKED_LEVEL = newMax;
      // update Levels UI after popup has been mounted
      setTimeout(() => levelsUI.setUnlocked?.(newMax), 0);
    }
  },
});


function wipeResumeForCurrentLevel() {
  if (!CURRENT_ACCESS_TOKEN) return;

  RESUME_TILES = new Set();
  RESUME_POS = null;

  apiSetProgress({
    uid: CURRENT_USER.uid,
    level: CURRENT_MAX_UNLOCKED_LEVEL,
    coins: CURRENT_USER?.coins ?? 0,
    paintedKeys: [],
    resume: null,
  }).catch(() => {});
}


function goToLevel(nextIndex) {
  levelIndex = Math.max(0, Math.min(levels.length - 1, nextIndex));
  const lvl = levels[levelIndex];

  const selectedLevelNumber = levelIndex + 1;

  game.setLevel(lvl);
// ✅ Capture spawn tile AFTER level fully loads
setTimeout(() => {
  const p = game.getPlayer?.();
  if (p) {
    LEVEL_START_KEY = `${p.x},${p.y}`;
    console.log("LEVEL_START_KEY =", LEVEL_START_KEY);
  }
}, 50);
  ui.setLevel(selectedLevelNumber);

  // Only logged-in users can resume
  if (!CURRENT_ACCESS_TOKEN) return;

  RESUME_ENABLED = true;

  // Fetch latest progress from backend memory (already loaded in CURRENT_MAX_UNLOCKED_LEVEL flow)
  fetch(`${BACKEND}/api/me`, {
    headers: {
      Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
    },
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((me) => {
      const progress = me?.progress;
      if (!progress) return;

      // Only resume if this level matches saved level
      if (progress.level !== selectedLevelNumber) return;

      const paintedKeys = progress.paintedKeys;
      const resume = progress.resume;

      if (Array.isArray(paintedKeys) || resume) {
        RESUME_TILES = new Set(Array.isArray(paintedKeys) ? paintedKeys : []);
        RESUME_POS = resume ?? null;

        game.applyProgress({
          paintedKeys: Array.from(RESUME_TILES),
          player: RESUME_POS,
        });
      }
    })
    .catch(() => {});
}

function goNextLevel() {
  goToLevel(levelIndex + 1);
}
winPopup.onNextLevel(() => {
  const nextLevelNumber = levelIndex + 2; // levelIndex is 0-based

  // 🔒 Guest limit: require login after level 5
if (!CURRENT_ACCESS_TOKEN && nextLevelNumber > GUEST_MAX_LEVEL) {
    winPopup.hide();
    ui.showLoginRequired();
    return;
  }

  winPopup.hide();
  goNextLevel();
});
winPopup.onWatchAdClick(async () => {
  if (!CURRENT_ACCESS_TOKEN) {
  ui.showLoginRequired();
  return;
}

  const nonce = crypto.randomUUID();

  const res = await fetch(`${BACKEND}/api/rewards/ad-50`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
    },
    body: JSON.stringify({ nonce }),
  });

  const out = await res.json();
  console.log("AD +50 RESPONSE", out);

  // ⏱️ COOLDOWN HANDLING (THIS WAS MISSING)
  if (out?.already) {
    alert("Ad already claimed. Please wait a few minutes.");
    return;
  }

  if (out?.user?.coins != null) {
    ui.setCoins(out.user.coins);
  }
});

// ---- SKIP / HINT buttons (backend-powered) ----
ui.onSkipClick(async () => {
  if (!CURRENT_ACCESS_TOKEN) {
    ui.showLoginRequired();
    return;
  }

  // try FREE skip first (same as restart)
  if (freeSkipsLeft() > 0) {
    try {
      const out = await apiSkip({ mode: "free" });
      if (!out?.ok) throw new Error(out?.error);

      if (out.user) {
        applyUserPatch(out.user);
        updateAllBadges();
      }

      goNextLevel();
      return;
    } catch {
      // fallback to popup if backend rejects
    }
  }

  // no free skips left → popup
  skipPopup.open({ freeLeft: 0 });
});

skipPopup.onFreeSkip(async () => {
  const out = await apiSkip({ mode: "free" });
  if (!out.ok) return alert(out.error || "Skip failed");

  if (out.user) {
    applyUserPatch(out.user);
    updateAllBadges(); // ✅ ADD THIS
  }

  skipPopup.hide();
  goNextLevel();
});

skipPopup.onBuySkip(async () => {
  const out = await apiSkip({ mode: "coins" });
  if (!out.ok) return alert(out.error || "Skip failed");

  if (out.user) {
    applyUserPatch(out.user);
    updateAllBadges();
  }

  skipPopup.hide();
  goNextLevel();
});

skipPopup.onWatchAdSkip(async () => {
  const out = await apiSkip({ mode: "ad" });
  if (!out.ok) return alert(out.error || "Skip failed");

  if (out.user) {
    applyUserPatch(out.user);
    updateAllBadges();
  }

  skipPopup.hide();
  goNextLevel();
});

// ---- HINT POPUP HANDLERS ----

hintPopup.onFreeHint(async () => {
  const out = await apiHint({ mode: "free" });
  if (!out.ok) return alert(out.error || "Hint failed");

  if (out.user) {
    applyUserPatch(out.user);
    updateAllBadges();
  }

  hintPopup.hide();
});

hintPopup.onBuyHint(async () => {
  const out = await apiHint({ mode: "coins" });
  if (!out.ok) return alert(out.error || "Hint failed");

  if (out.user) {
    applyUserPatch(out.user);
    updateAllBadges();
  }

  hintPopup.hide();
});

hintPopup.onWatchAdHint(async () => {
  const out = await apiHint({ mode: "ad" });
  if (!out.ok) return alert(out.error || "Hint failed");

  if (out.user) {
    applyUserPatch(out.user);
    updateAllBadges();
  }

  hintPopup.hide();
});

ui.onHintClick(async () => {
  if (!CURRENT_ACCESS_TOKEN) {
    ui.showLoginRequired();
    return;
  }

  // try FREE hint first (same logic as skip & restart)
  if (freeHintsLeft() > 0) {
    try {
      const out = await apiHint({ mode: "free" });
      if (!out?.ok) throw new Error(out?.error);

      if (out.user) {
        applyUserPatch(out.user);
        updateAllBadges();
      }

      // show hint effect here (your existing hint reveal logic)
      hintPopup.showHint?.();
      return;
    } catch {
      // fallback to popup if backend rejects
    }
  }

  // no free hints left → popup
  hintPopup.open({ freeLeft: 0 });
});

restartPopup.onBuyRestart(async () => {
  const out = await fetch(`${BACKEND}/api/restart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
    },
    body: JSON.stringify({ mode: "coins" }),
  }).then((r) => r.json());

  if (!out?.ok) return alert(out.error);

  applyUserPatch(out.user);
  updateAllBadges();
  wipeResumeForCurrentLevel();
  game.setLevel(levels[levelIndex]);
  restartPopup.hide();
});

restartPopup.onWatchAdRestart(async () => {
  const out = await fetch(`${BACKEND}/api/restart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
    },
    body: JSON.stringify({
      mode: "ad",
      nonce: crypto.randomUUID(),
    }),
  }).then((r) => r.json());

  if (!out?.ok) return alert(out.error);

  updateRestartBadge();
  game.setLevel(levels[levelIndex]);
  restartPopup.hide();
});

restartPopup.onFreeRestart(async () => {
  const res = await fetch(`${BACKEND}/api/restart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
    },
    body: JSON.stringify({ mode: "free" }),
  });

  const out = await res.json();
  if (!out?.ok) return;

  applyUserPatch(out.user);
  updateAllBadges();
  wipeResumeForCurrentLevel();
  game.setLevel(levels[levelIndex]);
  restartPopup.hide();
});
  // ---- GUEST ----
  ui.onGuestStart(() => {
  CURRENT_USER = { username: "Guest", uid: null };
  CURRENT_ACCESS_TOKEN = null;

  const guestProgress = loadGuestProgress();
  const unlocked = Math.min(guestProgress.maxLevel || 1, GUEST_MAX_LEVEL);
  ui.setUser({
  ...CURRENT_USER,
  level: CURRENT_MAX_UNLOCKED_LEVEL,
});

  document.body.classList.add("game-running");
  ui.hideWelcome();
  game.start();
  // force capture starting tile for resume AFTER login ready
if (CURRENT_ACCESS_TOKEN && RESUME_ENABLED) {
  const state = game.getState();
  const x = state.player.x;
  const y = state.player.y;

  scheduleResumeSave(levelIndex + 1, {
    key: `${x},${y}`,
    x,
    y,
  });
}
  updateAllBadges();
});
   // PROGRES LEVELS



// ---- PI LOGIN ----
ui.onLoginClick(async () => {
  const result = await ensurePiLogin({
    BACKEND,
    ui,
    onLogin: ({ accessToken }) => {
  CURRENT_ACCESS_TOKEN = normalizeToken(accessToken);
  localStorage.setItem("pi_access_token", CURRENT_ACCESS_TOKEN);
},
  });

  // 🔥 CRITICAL FIX: handle existing session
  if (!CURRENT_ACCESS_TOKEN && result?.accessToken) {
  CURRENT_ACCESS_TOKEN = normalizeToken(result.accessToken);
}

  if (!CURRENT_ACCESS_TOKEN) {
    return;
  }

 // await migrateGuestProgress({
  //  BACKEND,
  //  token: CURRENT_ACCESS_TOKEN,
 // });

  const me = await loadMeAndSyncUI({
    BACKEND,
    token: CURRENT_ACCESS_TOKEN,
    ui,
  });
  updateAllBadges();
  if (!me?.user) {
  console.error("Login succeeded but /api/me failed");
  return;
}

  const unlockedLevel =
    me?.progress?.level ??
    me?.progress?.maxLevel ??
    me?.progress?.highestLevel ??
    1;

  const UNLOCKED_LEVEL = Math.max(1, Number(unlockedLevel) || 1);


// 🔓 remove guest cap completely for logged-in users
window.__maze.guestMaxLevel = Infinity;

CURRENT_MAX_UNLOCKED_LEVEL = UNLOCKED_LEVEL;
levelsUI.setUnlocked?.(UNLOCKED_LEVEL);

ui.setUser({
  ...CURRENT_USER,
  level: CURRENT_MAX_UNLOCKED_LEVEL,
});

  // start at the unlocked level (or 1)
  setLevel(Math.max(0, UNLOCKED_LEVEL - 1));
  // enable in-progress resume only for logged-in users
  RESUME_ENABLED = true;
  RESUME_TILES = new Set();
  RESUME_POS = null;

// restore painted path + position ONLY if backend sent it
const paintedKeys = me?.progress?.paintedKeys;
const resume = me?.progress?.resume;

if (Array.isArray(paintedKeys) || (resume && resume.x != null && resume.y != null)) {

  if (Array.isArray(paintedKeys)) {
    RESUME_TILES.clear();
    for (const k of paintedKeys) RESUME_TILES.add(k);
  }

  if (resume && resume.x != null && resume.y != null) {
    RESUME_POS = { x: resume.x, y: resume.y };
  }
}

document.body.classList.add("game-running");
ui.hideWelcome();
  updateAllBadges();

if (!game.isRunning?.()) {
  game.start();
  // force capture starting tile for resume AFTER login ready
if (CURRENT_ACCESS_TOKEN && RESUME_ENABLED) {
  const state = game.getState();
  const x = state.player.x;
  const y = state.player.y;

  scheduleResumeSave(levelIndex + 1, {
    key: `${x},${y}`,
    x,
    y,
  });
}
  updateAllBadges();
  // ✅ capture original spawn tile
  const p = game.getPlayer?.();
 
}

// ✅ APPLY PROGRESS AFTER GAME STARTS (IMPORTANT)
if (RESUME_TILES.size > 0 || RESUME_POS) {
  game.applyProgress({
    paintedKeys: Array.from(RESUME_TILES),
    player: RESUME_POS,
  });

  // ✅ force repaint of current player tile (fix start tile bug)
  const p = game.getPlayer?.();
  if (p) {
    const k = `${p.x},${p.y}`;
    RESUME_TILES.add(k);
    game.applyProgress({
      paintedKeys: [k],
      player: null,
    });
  }
}

    updateAllBadges();
 
});
}

boot();