import "./style.css";
import "./css/ui.css";
import { mountLevelsUI } from "./ui/uiLevels.js";
import { mountUI } from "./ui/ui.js";
import { loadProgress } from "./api/loadProgress.js";
import { createGame } from "./game/game.js";
import { ensurePiLogin } from "./pi/piClient.js";
import { levels } from "./levels/index.js";
import { createWinPopup } from "./ui/uiWin.js";


const GUEST_PROGRESS_KEY = "guest_progress_v1";
const GUEST_MAX_LEVEL = 5;
let CURRENT_USER = null;
let CURRENT_ACCESS_TOKEN = null;
const BACKEND = "https://triumphant-gentleness-production.up.railway.app";
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


export async function apiClaimAd50() {
  const res = await fetch(`${BACKEND}/api/rewards/ad-50`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ nonce: "ad-50" }),
  });

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

  return me;
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
    // (We leave level coin logic for later if needed)
    winPopup.show({
      levelNumber: level?.number ?? 1,
    });
  },
});
winPopup.onNextLevel(() => {
  winPopup.hide();
  goNextLevel();
});
winPopup.onWatchAdClick(async () => {
  try {
    const res = await apiClaimAd50();

    if (res.cooldownSeconds > 0) {
      winPopup.showToast(
        `Wait ${res.cooldownSeconds}s before next ad`
      );
      winPopup.setAdCooldown(res.cooldownSeconds);
      return;
    }

    // success
    if (res.user?.coins != null) {
      ui.setCoins(res.user.coins);
    }

    winPopup.showToast("+50 coins 🎉");
    winPopup.setAdCooldown(30);

  } catch (e) {
    winPopup.showToast("Ad reward failed");
  }
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
  document.body.classList.add("game-running");
  ui.hideWelcome();

  if (!game.isRunning?.()) {
    game.start();
  }
});
}

boot();