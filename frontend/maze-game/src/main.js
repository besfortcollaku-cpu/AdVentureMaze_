
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

function freeRestartsLeft() {
  const used = Number(CURRENT_USER?.free_restarts_used || 0);
  return Math.max(0, FREE_RESTARTS - used);
}
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

function scheduleResumeSave(currentLevelNumber) {
  if (!CURRENT_USER?.uid) return;
  if (!RESUME_ENABLED) return;
  if (RESUME_SAVE_TIMER) return;

  RESUME_SAVE_TIMER = setTimeout(() => {
    RESUME_SAVE_TIMER = null;

    const safeLevel = Math.max(
      Number(CURRENT_MAX_UNLOCKED_LEVEL || 1),
      Number(currentLevelNumber || 1)
    );

    console.log(
      "SAVING RESUME",
      safeLevel,
      RESUME_TILES.size,
      RESUME_POS
    );
// ✅ always include original spawn tile
if (LEVEL_START_KEY) {
  RESUME_TILES.add(LEVEL_START_KEY);
}
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

  const res = await fetch(`${BACKEND}/progress`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}`,
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
      Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}`,
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
      Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}`,
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
      Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}`,
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
      Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}`,
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
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;

  const me = await res.json();

  // 🔥 THIS WAS MISSING
  CURRENT_USER = {
    uid: me.user.uid,
    username: me.user.username,
  };

  ui.setUser(CURRENT_USER);
  ui.setCoins(me.user.coins ?? 0);

  // keep extra server fields on CURRENT_USER for skip/hint logic
  CURRENT_USER.free_skips_used = me.user.free_skips_used ?? 0;
  CURRENT_USER.free_hints_used = me.user.free_hints_used ?? 0;
  CURRENT_USER.free_restarts_used = me.user.free_restarts_used ?? 0;

return me;
}

function updateAllBadges() {
  if (!CURRENT_USER) return;

  updateBadge({
    badgeId: "restartCount",
    left: Math.max(0, FREE_RESTARTS - (CURRENT_USER.free_restarts_used || 0)),
  });

  updateBadge({
    badgeId: "skipCount",
    left: Math.max(0, FREE_SKIPS - (CURRENT_USER.free_skips_used || 0)),
  });

  updateBadge({
    badgeId: "hintCount",
    left: Math.max(0, FREE_HINTS - (CURRENT_USER.free_hints_used || 0)),
  });
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
  CURRENT_ACCESS_TOKEN = storedToken;
}
  const root = document.querySelector("#app");
  if (!root) {
    document.body.innerHTML = "<h1>#app not found</h1>";
    return;
  }

  // iOS hard lock
  document.body.style.position = "fixed";
  document.body.style.width = "100%";
  document.body.style.height = "100%";
  
  

  // Mount UI
const ui = mountUI(root);



// Expose a tiny bridge for UI modules that don't have direct access to `ui`.
// (Used by the Levels screen to show "Login required" for locked guest levels.)
window.__maze = window.__maze || {};
window.__maze.guestMaxLevel = GUEST_MAX_LEVEL;
window.__maze.showLoginRequired = () => ui.showLoginRequired();
window.__maze.isLoggedIn = () => Boolean(CURRENT_USER?.uid);
if (CURRENT_ACCESS_TOKEN) {
  fetch(`${BACKEND}/api/me`, {
    headers: {
      Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}`,
    },
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((me) => {
      if (!me?.user) return;

      CURRENT_USER = {
        ...me.user,
        free_skips_used: me.user.free_skips_used ?? 0,
        free_hints_used: me.user.free_hints_used ?? 0,
        free_restarts_used: me.user.free_restarts_used ?? 0,
      };

      ui.setUser(me.user);
      ui.setCoins(me.user.coins ?? 0);

      const unlockedLevel =
        me?.progress?.level ??
        me?.progress?.maxLevel ??
        me?.progress?.highestLevel ??
        1;

      const UNLOCKED_LEVEL = Math.max(1, Number(unlockedLevel) || 1);

      window.__maze.guestMaxLevel = Infinity;
      CURRENT_MAX_UNLOCKED_LEVEL = UNLOCKED_LEVEL;
      levelsUI.setUnlocked?.(UNLOCKED_LEVEL);

      // load correct level
      setLevel(Math.max(0, UNLOCKED_LEVEL - 1));

      // enable resume
      RESUME_ENABLED = true;
      RESUME_TILES = new Set();
      RESUME_POS = null;

      const paintedKeys = me?.progress?.paintedKeys;
      const resume = me?.progress?.resume;

      if (Array.isArray(paintedKeys)) {
        for (const k of paintedKeys) RESUME_TILES.add(k);
      }

      if (resume && resume.x != null && resume.y != null) {
        RESUME_POS = { x: resume.x, y: resume.y };
      }

      if (RESUME_TILES.size > 0 || RESUME_POS) {
        game.applyProgress({
          paintedKeys: Array.from(RESUME_TILES),
          player: RESUME_POS,
        });
      }

      document.body.classList.add("game-running");
      ui.hideWelcome();

      if (!game.isRunning?.()) {
        game.start();
    updateAllBadges();
        
      }
    })
    .catch(() => {});
}
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

ui.onAccountClick(async () => {
  // already logged in → show account
  if (CURRENT_USER?.uid) {
    return; // ui.js will open account UI
  }

  // guest → force Pi login
  ui.showWelcome();
  ui.triggerLogin();
});
const levelsUI = mountLevelsUI(root, { totalLevels: levels.length });  
ui.levelsBtn.addEventListener("click", () => {
  // keep levels UI in sync before opening
if (CURRENT_USER?.uid) {
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
  if (!CURRENT_USER?.uid && levelNumber > GUEST_MAX_LEVEL) {
    ui.showLoginRequired();
    return;
  }
  goToLevel(levelNumber - 1);
});
  
  ui.showWelcome();
  
ui.onRestartClick(async () => {
  if (!CURRENT_USER?.uid) {
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
        Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ mode: "free" }),
    }).then(r => r.json());

    if (!out?.ok) return;

    CURRENT_USER = { ...CURRENT_USER, ...out.user };
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
    if (!CURRENT_USER?.uid) return;
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
            CURRENT_USER = { ...CURRENT_USER, ...out.user };
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
if (CURRENT_USER?.uid) {
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
    if (!CURRENT_USER?.uid) {
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
  if (!CURRENT_USER?.uid) return;

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
  // ✅ capture spawn tile for this level
setTimeout(() => {
  const p = game.getPlayer?.();
  if (p) {
    LEVEL_START_KEY = `${p.x},${p.y}`;
  }
}, 0);
  ui.setLevel(selectedLevelNumber);

  // Only logged-in users can resume
  if (!CURRENT_USER?.uid) return;

  RESUME_ENABLED = true;

  // Fetch latest progress from backend memory (already loaded in CURRENT_MAX_UNLOCKED_LEVEL flow)
  fetch(`${BACKEND}/api/me`, {
    headers: {
      Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}`,
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
  if (!CURRENT_USER?.uid && nextLevelNumber > GUEST_MAX_LEVEL) {
    winPopup.hide();
    ui.showLoginRequired();
    return;
  }

  winPopup.hide();
  goNextLevel();
});
winPopup.onWatchAdClick(async () => {
  if (!CURRENT_USER?.uid) {
  ui.showLoginRequired();
  return;
}

  const nonce = crypto.randomUUID();

  const res = await fetch(`${BACKEND}/api/rewards/ad-50`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}`,
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
  if (!CURRENT_USER?.uid) {
    ui.showLoginRequired();
    return;
  }

  // try FREE skip first (same as restart)
  if (freeSkipsLeft() > 0) {
    try {
      const out = await apiSkip({ mode: "free" });
      if (!out?.ok) throw new Error(out?.error);

      if (out.user) {
        CURRENT_USER = { ...CURRENT_USER, ...out.user };
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
    CURRENT_USER = { ...CURRENT_USER, ...out.user };
    ui.setCoins(out.user.coins);
  }
  goNextLevel();
});

skipPopup.onBuySkip(async () => {
  const out = await apiSkip({ mode: "coins" });
  if (!out.ok) return alert(out.error || "Skip failed");
  if (out.user) {
    CURRENT_USER = { ...CURRENT_USER, ...out.user };
    ui.setCoins(out.user.coins);
  }
  goNextLevel();
});

skipPopup.onWatchAdSkip(async () => {
  const out = await apiSkip({ mode: "ad" });
  if (!out.ok) return alert(out.error || "Skip failed");
  goNextLevel();
});

ui.onHintClick(async () => {
  if (!CURRENT_USER?.uid) {
    ui.showLoginRequired();
    return;
  }

  // try FREE hint first (same logic as skip & restart)
  if (freeHintsLeft() > 0) {
    try {
      const out = await apiHint({ mode: "free" });
      if (!out?.ok) throw new Error(out?.error);

      if (out.user) {
        CURRENT_USER = { ...CURRENT_USER, ...out.user };
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
      Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ mode: "coins" }),
  }).then((r) => r.json());

  if (!out?.ok) return alert(out.error);

  CURRENT_USER = { ...CURRENT_USER, ...out.user };
  updateRestartBadge();
  wipeResumeForCurrentLevel();
  game.setLevel(levels[levelIndex]);
  restartPopup.hide();
});

restartPopup.onWatchAdRestart(async () => {
  const out = await fetch(`${BACKEND}/api/restart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}`,
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
      Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ mode: "free" }),
  });

  const out = await res.json();
  if (!out?.ok) return;

  CURRENT_USER = { ...CURRENT_USER, ...out.user };
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
  CURRENT_MAX_UNLOCKED_LEVEL = unlocked;
  levelsUI.setUnlocked?.(unlocked);

  document.body.classList.add("game-running");
  ui.hideWelcome();
  game.start();
  updateAllBadges();
});
   // PROGRES LEVELS



// ---- PI LOGIN ----
ui.onLoginClick(async () => {
  const result = await ensurePiLogin({
    BACKEND,
    ui,
    onLogin: ({ accessToken }) => {
  CURRENT_ACCESS_TOKEN = accessToken;
  localStorage.setItem("pi_access_token", accessToken);
},
  });

  // 🔥 CRITICAL FIX: handle existing session
  if (!CURRENT_ACCESS_TOKEN && result?.accessToken) {
    CURRENT_ACCESS_TOKEN = result.accessToken;
  }

  if (!CURRENT_ACCESS_TOKEN) {
    return;
  }

  await migrateGuestProgress({
    BACKEND,
    token: CURRENT_ACCESS_TOKEN,
  });

  const me = await loadMeAndSyncUI({
    BACKEND,
    token: CURRENT_ACCESS_TOKEN,
    ui,
  });

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

if (!game.isRunning?.()) {
  game.start();
  updateAllBadges();
  // ✅ capture original spawn tile
  const p = game.getPlayer?.();
  if (p) {
    LEVEL_START_KEY = `${p.x},${p.y}`;
  }
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