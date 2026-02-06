import "./style.css";
import "./css/ui.css";
import { mountLevelsUI } from "./ui/uiLevels.js";
import { mountUI } from "./ui/ui.js";
import { loadProgress } from "./api/loadProgress.js";
import { createGame } from "./game/game.js";
import { ensurePiLogin } from "./pi/piClient.js";
import { levels } from "./levels/index.js";
import { createWinPopup } from "./ui/uiWin.js";
import { createSkipPopup } from "./ui/uiSkipPopup.js";
import { createHintPopup } from "./ui/uiHintPopup.js";
import { mountUI } from "./ui/ui.js";
import { openHintPopup } from "./ui/uiHints.js";
import { openSkipPopup } from "./ui/uiSkip.js";

const ui = mountUI(document);

ui.hintBtn.addEventListener("click", () => {
  openHintPopup(() => {
    alert("Hint unlocked!");
  });
});

ui.skipBtn.addEventListener("click", () => {
  openSkipPopup(() => {
    // goNextLevel() or reload
  });
});
import { openSkipPopup } from "./ui/uiSkip.js";
import { openHintPopup } from "./ui/uiHints.js";

skipBtn.onclick = () => {
  openSkipPopup(() => {
    goNextLevel(); // or location.reload()
  });
};

hintBtn.onclick = () => {
  openHintPopup(() => {
    alert("Hint unlocked! (replace with real hint)");
  });
};


const GUEST_PROGRESS_KEY = "guest_progress_v1";
const GUEST_MAX_LEVEL = 5;
let CURRENT_USER = null;
let CURRENT_ACCESS_TOKEN = null;
const BACKEND = "https://triumphant-gentleness-production.up.railway.app";
const FREE_SKIPS = 3;
const FREE_HINTS = 3;

let levelIndex = 0;
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

  return me;
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
  document.addEventListener(
    "touchmove",
    (e) => e.preventDefault(),
    { passive: false }
  );
  

  // Mount UI
const ui = mountUI(root);
if (CURRENT_ACCESS_TOKEN) {
  fetch(`${BACKEND}/api/me`, {
    headers: {
      Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}`,
    },
  })
    .then((r) => r.ok ? r.json() : null)
    .then((me) => {
      if (me?.user) {
        CURRENT_USER = me.user;
        ui.setUser(me.user);
        ui.setCoins(me.user.coins ?? 0);
      }
    })
    .catch(() => {});
}
  const winPopup = createWinPopup();
const skipPopup = createSkipPopup();
const hintPopup = createHintPopup();

  let levelIndex = 0;

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
const levelsUI = mountLevelsUI(root);  
ui.levelsBtn.addEventListener("click", () => {
  levelsUI.open();
});
  
  ui.showWelcome();


// Create game (DO NOT START)
const game = createGame({
  canvas: ui.canvas,
  level: levels[0],
  getCurrentUser: () => CURRENT_USER ?? { username: "guest", uid: null },

  onLevelComplete({ level }) {
    // ✅ server reward: +1 coin once per level
    if (CURRENT_ACCESS_TOKEN) {
      apiClaimLevelComplete(level?.number ?? levelIndex + 1)
        .then((out) => {
          if (out?.user) {
            CURRENT_USER = { ...CURRENT_USER, ...out.user };
            ui.setCoins(out.user.coins ?? 0);
          }
        })
        .catch(() => {});
    }
    winPopup.show({
      levelNumber: level?.number ?? 1,
    });
  },
});

function goToLevel(nextIndex) {
  levelIndex = Math.max(0, Math.min(levels.length - 1, nextIndex));
  const lvl = levels[levelIndex];
  game.setLevel(lvl);
  ui.setLevel(levelIndex + 1);
}

function goNextLevel() {
  goToLevel(levelIndex + 1);
}
winPopup.onNextLevel(() => {
  winPopup.hide();
  goNextLevel();
});
winPopup.onWatchAdClick(async () => {
  if (!CURRENT_ACCESS_TOKEN) {
    alert("Login required");
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
ui.skipBtn.addEventListener("click", () => {
  if (!CURRENT_ACCESS_TOKEN) {
    alert("Login required");
    return;
  }
  skipPopup.show({ freeLeft: freeSkipsLeft() });
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

ui.hintBtn.addEventListener("click", () => {
  if (!CURRENT_ACCESS_TOKEN) {
    alert("Login required");
    return;
  }
  hintPopup.show({ freeLeft: freeHintsLeft() });
});

hintPopup.onFreeHint(async () => {
  const out = await apiHint({ mode: "free" });
  if (!out.ok) return alert(out.error || "Hint failed");
  if (out.user) {
    CURRENT_USER = { ...CURRENT_USER, ...out.user };
    ui.setCoins(out.user.coins);
  }
  alert("Hint unlocked! (plug your hint text here)");
});

hintPopup.onBuyHint(async () => {
  const out = await apiHint({ mode: "coins" });
  if (!out.ok) return alert(out.error || "Hint failed");
  if (out.user) {
    CURRENT_USER = { ...CURRENT_USER, ...out.user };
    ui.setCoins(out.user.coins);
  }
  alert("Hint unlocked! (plug your hint text here)");
});

hintPopup.onWatchAdHint(async () => {
  const out = await apiHint({ mode: "ad" });
  if (!out.ok) return alert(out.error || "Hint failed");
  alert("Hint unlocked! (plug your hint text here)");
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
    onLogin: ({ accessToken }) => {
      // called ONLY on fresh login
      CURRENT_ACCESS_TOKEN = accessToken;
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

  const maxLevel =
    me?.progress?.maxLevel ??
    me?.progress?.highestLevel ??
    1;

  levelsUI.setUnlocked?.(maxLevel);
  // start at the unlocked level (or 1)
  setLevel(Math.max(0, maxLevel - 1));
  document.body.classList.add("game-running");
  ui.hideWelcome();

  if (!game.isRunning?.()) {
    game.start();
  }
});
}

boot();