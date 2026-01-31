import "./style.css";
import "./css/ui.css";
import { mountLevelsUI } from "./ui/uiLevels.js";
import { mountUI } from "./ui/ui.js";
import { loadProgress } from "./api/loadProgress.js";
import { createGame } from "./game/game.js";
import { ensurePiLogin } from "./pi/piClient.js";
import { levels } from "./levels/index.js";
import { createWinPopup } from "./ui/uiWin.js";

const winPopup = createWinPopup();
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


let levelIndex = 0;
function goNextLevel() {
  levelIndex++;

  if (levelIndex >= levels.length) {
    levelIndex = levels.length - 1;
    return;
  }

  game.setLevel(levels[levelIndex]);
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
  onLevelComplete() {
  const unlockedLevel = levelIndex + 2; // 🔥 IMPORTANT

  if (CURRENT_USER?.uid && CURRENT_ACCESS_TOKEN) {
    apiClaimLevelComplete(unlockedLevel)
      .then((out) => {
        if (out?.user?.coins != null) {
          ui.setCoins(out.user.coins);
        }
      })
      .catch(() => {});
  }

  winPopup.show({
    levelNumber: levelIndex + 1,
  });
},
});
  winPopup.onNextLevel(() => {
  winPopup.hide();
  goNextLevel();
});

winPopup.onWatchAdClick(async () => {
  if (!CURRENT_USER?.uid || !CURRENT_ACCESS_TOKEN) {
    ui.showToast?.("Login required for rewards");
    return;
  }

  try {
    // simulate ad watching
    ui.showToast?.("Watching ad…");
    await new Promise((r) => setTimeout(r, 5000));

    const out = await apiClaimAdReward();

    if (out?.user?.coins != null) {
      ui.setCoins(out.user.coins);
    }
  } catch (e) {
    ui.showToast?.("Ad reward failed");
  }

  winPopup.hide();
  goNextLevel();
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

  // no session → start Pi auth NOW
  if (!result?.ok) {
    const { auth } = await import("./pi/piAuth.js").then(m =>
      m.piLoginAndVerify(BACKEND)
    );
    CURRENT_ACCESS_TOKEN = auth.accessToken;
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