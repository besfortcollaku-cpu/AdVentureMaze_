// src/main.js
import "./style.css";

import { mountUI } from "./ui/ui.js";
import { enforcePiEnvironment } from "./pi/piDetect.js";
import { initPi } from "./pi/piInit.js";

import { createGame } from "./game/game.js";
import { levels } from "./levels/index.js";

import { getSettings, setSetting, subscribeSettings } from "./settings.js";
import { ensureAudioUnlocked, stopRollSound } from "./game/rollSound.js";

const BACKEND = "https://adventuremaze.onrender.com";

let CURRENT_USER = { username: "guest", uid: null };
let CURRENT_ACCESS_TOKEN = null;
let HAS_PI_BADGE = false;
let UNLOCKED_LEVEL = 1;

let levelIndex = 0;
let game = null;
let ui = null;

// local cache synced from /api/me
let COINS = 0;

// prevent double reward per completion
let rewardedThisLevel = false;

// ---------------------------
// Backend helpers
// ---------------------------

function hasPiSession() {
  try {
    const raw = localStorage.getItem("pi_session_v1");
    if (!raw) return false;
    const s = JSON.parse(raw);
    return !!s?.accessToken;
  } catch {
    return false;
  }
}

function createAndStartGame(levelIdx) {
  if (!game) {

}
function getMaxPlayableLevel() {
  if (HAS_PI_BADGE) return UNLOCKED_LEVEL;
  return 5; // guest limit
}
function authHeaders() {
  if (!CURRENT_ACCESS_TOKEN) {
    throw new Error("Missing access token. Please login again.");
  }
  return {
    Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}`,
  };
}

function uuid() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

// ✅ UX delay helper (5s default)
function delay(ms = 5000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ✅ read response safely (JSON or text)
async function readRes(res) {
  const txt = await res.text().catch(() => "");
  let data = {};
  try {
    data = txt ? JSON.parse(txt) : {};
  } catch {
    data = {};
  }
  return { txt, data };
}

function normalizeErr(e) {
  return e?.message || String(e);
}

function handleAuthExpiredIfNeeded(msg) {
  if (msg.includes("(HTTP 401)") || msg.toLowerCase().includes("invalid pi token")) {
    alert("Session expired. Please login again.");
    return true;
  }
  return false;
}

async function apiGetMe() {
  const res = await fetch(`${BACKEND}/api/me`, { headers: { ...authHeaders() } });
  const { data } = await readRes(res);
  if (!res.ok || !data?.ok) {
    throw new Error(`${data?.error || "api/me failed"} (HTTP ${res.status})`);
  }
  return data;
}

async function apiSetProgress({ uid, level, coins }) {
  const res = await fetch(`${BACKEND}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ uid, level, coins }),
  });

  const { data } = await readRes(res);
  if (!res.ok || !data?.ok) {
    throw new Error(`${data?.error || "progress save failed"} (HTTP ${res.status})`);
  }
  return data;
}

async function apiClaimLevelComplete(levelNumber) {
  const res = await fetch(`${BACKEND}/api/rewards/level-complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ level: levelNumber }),
  });

  const { data } = await readRes(res);
  if (!res.ok || !data?.ok) {
    throw new Error(`${data?.error || "level-complete failed"} (HTTP ${res.status})`);
  }
  return data; // { ok, already, user }
}

async function apiAd50() {
  const res = await fetch(`${BACKEND}/api/rewards/ad-50`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ nonce: `ad50:${CURRENT_USER.uid}:${uuid()}` }),
  });

  const { data } = await readRes(res);
  if (!res.ok || !data?.ok) {
    throw new Error(`${data?.error || "ad-50 failed"} (HTTP ${res.status})`);
  }
  return data;
}

async function apiSkip() {
  const res = await fetch(`${BACKEND}/api/skip`, {
    method: "POST",
    headers: { ...authHeaders() },
  });

  const { data } = await readRes(res);
  if (!res.ok || !data?.ok) {
    throw new Error(`${data?.error || "skip failed"} (HTTP ${res.status})`);
  }
  return data;
}

async function apiHint() {
  const res = await fetch(`${BACKEND}/api/hint`, {
    method: "POST",
    headers: { ...authHeaders() },
  });

  const { data } = await readRes(res);
  if (!res.ok || !data?.ok) {
    throw new Error(`${data?.error || "hint failed"} (HTTP ${res.status})`);
  }
  return data;
}

function clampLevelIndex(i) {
  if (i < 0) return 0;
  if (i >= levels.length) return 0;
  return i;
}

// ---------------------------
// Boot
// ---------------------------
async function boot() {
  ui = mountUI(document.querySelector("#app"));


// Level select via joystick icon
document.getElementById("controls")?.addEventListener("click", () => {
  ui.showLevelSelect({
  totalLevels: levels.length,
  currentLevel: levelIndex + 1,
  isCompleted: (lvl) => lvl <= getMaxPlayableLevel(),
});
});


  // unlock audio after first gesture
  ui.onFirstUserGesture(() => ensureAudioUnlocked());

  // settings
  const s0 = getSettings();
  ui.setSoundEnabled(s0.sound);
  ui.setVibrationEnabled(s0.vibration);

  ui.onSoundToggle((v) => {
    setSetting("sound", v);
    if (!v) stopRollSound();
  });
  ui.onVibrationToggle((v) => setSetting("vibration", v));

  subscribeSettings((s) => {
    ui.setSoundEnabled(s.sound);
    ui.setVibrationEnabled(s.vibration);
    if (!s.sound) stopRollSound();
  });

  // Pi environment
  const env = await enforcePiEnvironment({
    desktopBlockEl: document.getElementById("desktopBlock"),
  });
  if (!env.ok) return;

  // init Pi SDK
  initPi();

HAS_PI_BADGE = hasPiSession();
console.log("[PI BADGE]", HAS_PI_BADGE);
  // login
  

  // load server state
  let me = null;

if (HAS_PI_BADGE) {
  try {
    me = await apiGetMe();
  } catch (e) {
    console.warn("Profile load skipped (guest mode):", e);
  }
}

if (me) {
  const serverUser = me.user;
  const serverProgress = me.progress;

  const savedLevel = Number(serverProgress?.level || 1);
  levelIndex = clampLevelIndex(savedLevel - 1);
  UNLOCKED_LEVEL = savedLevel;

  CURRENT_USER = {
    username: serverUser.username,
    uid: serverUser.uid,
  };

  COINS = Number(serverUser.coins || 0);
} else {
  // ✅ Guest defaults
  levelIndex = 0;
  UNLOCKED_LEVEL = 1;
  CURRENT_USER = { username: "guest", uid: null };
  COINS = 0;
}

ui.setCoins(COINS);

  // WIN popup actions
  ui.onWinNext(async () => {
    ui.hideWinPopup();
    await goNextLevel();
  });

  // ✅ Watch Ad: wait 5s then call backend
  ui.onWinAd(async () => {
    try {
      ui.showToast?.("Watching ad…");
      await delay(5000);

      const out = await apiAd50();
      COINS = Number(out?.user?.coins ?? COINS);
      ui.setCoins(COINS);

      ui.showToast?.("Reward granted +50");
    } catch (e) {
      const msg = normalizeErr(e);
      if (!handleAuthExpiredIfNeeded(msg)) {
        alert("Ad reward failed: " + msg);
      }
    }

    ui.hideWinPopup();
    await goNextLevel();
  });

  // ✅ Hook Skip / Hint buttons
  document.getElementById("x3Btn")?.addEventListener("click", async () => {
    if (!CURRENT_USER?.uid) return;

    try {
      ui.showToast?.("Processing skip…");
      await delay(5000);

      const out = await apiSkip();
      COINS = Number(out?.user?.coins ?? COINS);
      ui.setCoins(COINS);

      ui.showToast?.(out?.mode === "free" ? "Free skip used" : "Skip used (-50 coins)");

      await goNextLevel();
    } catch (e) {
      const msg = normalizeErr(e);
      if (!handleAuthExpiredIfNeeded(msg)) alert(msg);
    }
  });

  document.getElementById("hintBtn")?.addEventListener("click", async () => {
    if (!CURRENT_USER?.uid) return;

    try {
      ui.showToast?.("Loading hint…");
      await delay(5000);

      const out = await apiHint();
      COINS = Number(out?.user?.coins ?? COINS);
      ui.setCoins(COINS);

      const mode = out?.mode === "free" ? "Free hint used" : "Paid hint (-50)";
      ui.showToast?.(`${mode}. Free hints left: ${out?.freeLeft ?? 0}`);
    } catch (e) {
      const msg = normalizeErr(e);
      if (!handleAuthExpiredIfNeeded(msg)) alert(msg);
    }
  });

// ---------------------------
// Level flow
// ---------------------------
function onLevelComplete() {
  const isLastLevel = levelIndex >= levels.length - 1;

  // ✅ claim +1 once per level completion
  if (!rewardedThisLevel) {
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
if (CURRENT_USER?.uid) {
  const unlocked = Math.min(levelIndex + 2, levels.length);

  (async () => {
    try {
      await apiSetProgress({
        uid: CURRENT_USER.uid,
        level: unlocked,
      });
    } catch (e) {
      console.warn("progress save failed:", e);
    }
  })();
}

ui.showWinPopup({
  levelNumber: levelIndex + 1,
  isLastLevel,
});
async function goNextLevel() {
  const max = getMaxPlayableLevel();
  const nextIndex = levelIndex + 1;

  if (nextIndex + 1 > max) {
    ui.showToast?.("🔒 Login with Pi to unlock more levels");
    return;
  }

  levelIndex = clampLevelIndex(nextIndex);
  rewardedThisLevel = false;

  ui.hideWinPopup?.();
  ui.setLevel(levelIndex + 1);

  createAndStartGame(levelIndex);
}
  // save progress only if logged in
  if (CURRENT_USER?.uid) {
(async () => {
  try {
    await apiSetProgress({
      uid: CURRENT_USER.uid,
      level: nextLevelNumber,
    });
  } catch (e) {
    console.warn("progress save failed:", e);
  }
})();
  

boot();