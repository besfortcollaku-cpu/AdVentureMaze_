import "./style.css";
import "./css/ui.css";
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
function requireAuthOrOfferAd(actionName) {
  if (CURRENT_USER?.uid) return true;

  ui.showToast?.(`${actionName} requires login`);
  ui.showLoginGate();
  return false;
}

function onLevelComplete() {
  const isLastLevel = levelIndex >= levels.length - 1;

  if (!rewardedThisLevel && CURRENT_USER?.uid) {
    rewardedThisLevel = true;

    (async () => {
      try {
        const out = await apiClaimLevelComplete(levelIndex + 1);
        COINS = Number(out?.user?.coins ?? COINS);
        ui.setCoins(COINS);
      } catch (e) {
        console.warn("level reward failed:", e);
      }
    })();
  }

  ui.showWinPopup({ levelNumber: levelIndex + 1, isLastLevel });
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
  ui.onWinAd(async () => {
  if (!requireAuthOrOfferAd("Ad reward")) return;

  try {
    ui.showToast?.("Watching ad…");
    await delay(5000);

    const out = await apiAd50();
    COINS = Number(out?.user?.coins ?? COINS);
    ui.setCoins(COINS);
  } catch (e) {
    alert("Ad reward failed");
  }

  ui.hideWinPopup();
  await goNextLevel();
});
  document.getElementById("skipBtn")?.addEventListener("click", async () => {
  if (!requireAuthOrOfferAd("Skip")) return;

  try {
    await delay(5000);
    const out = await apiSkip();
    COINS = Number(out?.user?.coins ?? COINS);
    ui.setCoins(COINS);
    await goNextLevel();
  } catch (e) {
    alert("Skip failed");
  }
});

document.getElementById("hintBtn")?.addEventListener("click", async () => {
  if (!requireAuthOrOfferAd("Hint")) return;

  try {
    await delay(5000);
    const out = await apiHint();
    COINS = Number(out?.user?.coins ?? COINS);
    ui.setCoins(COINS);
  } catch (e) {
    alert("Hint failed");
  }
});

  

  // Mount UI
const ui = mountUI(root);
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