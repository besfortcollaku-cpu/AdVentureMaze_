// src/main.js
import "./style.css";

import { mountUI } from "./ui/ui.js";
import { enforcePiEnvironment } from "./pi/piDetect.js";
import { initPi } from "./pi/piInit.js";
import { ensurePiLogin } from "./pi/piClient.js";

import { createGame } from "./game/game.js";
import { levels } from "./levels/index.js";

import { getSettings, setSetting, subscribeSettings } from "./settings.js";
import { ensureAudioUnlocked, stopRollSound } from "./game/rollSound.js";

const BACKEND = "https://adventuremaze.onrender.com";

let CURRENT_USER = { username: "guest", uid: null };
let CURRENT_ACCESS_TOKEN = null;
let IS_GUEST = true;
const FREE_LEVEL_LIMIT = 5;
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
    IS_GUEST = true;
CURRENT_USER = { uid: "guest", username: "guest" };
UNLOCKED_LEVEL = FREE_LEVEL_LIMIT;
  if (i < 0) return 0;
  if (i >= levels.length) return 0;
  return i;
}

// ---------------------------
// Boot
// ---------------------------
async function boot() {
 

  const root = document.querySelector("#app");
  if (!root) {
    document.body.innerHTML = "<h1>#app not found</h1>";
    return;
  }

  // mount UI
  ui = mountUI(root);

  // ensure guest user
  if (!CURRENT_USER) {
    CURRENT_USER = { uid: "guest", username: "guest" };
    IS_GUEST = true;
  }

  // audio unlock
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

// ⚠️ DO NOT RETURN — allow guest play
if (!env.ok) {
  console.warn("Pi environment not ready, continuing as guest");
}

  // init Pi SDK
  initPi();

  // load server state ONLY if logged in
  if (!IS_GUEST) {
    try {
      const me = await apiGetMe();
      const serverUser = me.user;
      const serverProgress = me.progress;

      const savedLevel = Number(serverProgress?.level || 1);
      levelIndex = clampLevelIndex(savedLevel - 1);
      UNLOCKED_LEVEL = savedLevel;

      CURRENT_USER = { username: serverUser.username, uid: serverUser.uid };
      COINS = Number(serverUser.coins || 0);
      ui.setCoins(COINS);
    } catch (e) {
      const msg = normalizeErr(e);
      if (!handleAuthExpiredIfNeeded(msg)) {
        alert("Failed to load profile: " + msg);
      }
      return;
    }
  }

  // CREATE GAME (ON APP LOAD — ONLY ONCE)
  rewardedThisLevel = false;
  const firstLevel = levels[levelIndex];

  game = createGame({
    BACKEND,
    canvas: ui.canvas,
    getCurrentUser: () => CURRENT_USER,
    level: firstLevel,
    onLevelComplete,
  });

  game.start();

  // level select button
  document.getElementById("controls")?.addEventListener("click", () => {
    ui.showLevelSelect({
      totalLevels: levels.length,
      currentLevel: levelIndex + 1,
      isCompleted: (lvl) => lvl < UNLOCKED_LEVEL,
    });
  });

  ui.onLevelSelect((selectedIndex) => {
    const targetLevel = selectedIndex + 1;

    if (IS_GUEST && targetLevel > FREE_LEVEL_LIMIT) {
  ui.showLoginGate({
    title: "Login to continue",
    message: "You’ve reached the free limit. Log in with Pi to unlock more levels and save your progress.",
  });
  return;
}

    levelIndex = clampLevelIndex(selectedIndex);
    rewardedThisLevel = false;
    game.setLevel(levels[levelIndex]);
    ui.setLevel(levelIndex + 1);
  });

  // WIN popup actions
ui.onWinNext(async () => {
  ui.hideWinPopup();

  const nextLevel = levelIndex + 2;

  if (IS_GUEST && nextLevel > FREE_LEVEL_LIMIT) {
    ui.showLoginGate({
      title: "Login to continue",
      message:
        "You’ve reached the free limit. Log in with Pi to unlock more levels and save your progress.",
    });
    return;
  }

  await goNextLevel();
});

  ui.onWinAd(async () => {
      if (IS_GUEST && levelIndex + 1 >= FREE_LEVEL_LIMIT) {
  ui.showLoginGate({
    title: "Login to continue",
    message: "You’ve reached the free limit. Log in with Pi to unlock more levels and save your progress.",
  });
  return;
}
}
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

  // Skip
  document.getElementById("x3Btn")?.addEventListener("click", async () => {
    if (IS_GUEST) return;

    try {
      await delay(5000);
      const out = await apiSkip();
      COINS = Number(out?.user?.coins ?? COINS);
      ui.setCoins(COINS);
      await goNextLevel();
    } catch (e) {
      const msg = normalizeErr(e);
      if (!handleAuthExpiredIfNeeded(msg)) alert(msg);
    }
  });

  // Hint
  document.getElementById("hintBtn")?.addEventListener("click", async () => {
    if (IS_GUEST) return;

    try {
      await delay(5000);
      const out = await apiHint();
      COINS = Number(out?.user?.coins ?? COINS);
      ui.setCoins(COINS);
    } catch (e) {
      const msg = normalizeErr(e);
      if (!handleAuthExpiredIfNeeded(msg)) alert(msg);
    }
  });
}

// ---------------------------
// Level flow
// ---------------------------
function onLevelComplete() {
  const isLastLevel = levelIndex >= levels.length - 1;

  if (!rewardedThisLevel) {
    rewardedThisLevel = true;
    (async () => {
      try {
        const out = await apiClaimLevelComplete(levelIndex + 1);
        COINS = Number(out?.user?.coins ?? COINS);
        ui.setCoins(COINS);
      } catch {}
    })();
  }

  const nextLevelNumber = isLastLevel ? 1 : levelIndex + 2;

  if (!IS_GUEST) {
    (async () => {
      try {
        await apiSetProgress({
          uid: CURRENT_USER.uid,
          level: nextLevelNumber,
          coins: COINS,
        });
        UNLOCKED_LEVEL = nextLevelNumber;
      } catch {}
    })();
  }

  ui.showWinPopup({
    levelNumber: levelIndex + 1,
    isLastLevel,
  });
}

async function goNextLevel() {
  const next = levelIndex + 1;

  if (IS_GUEST && next + 1 > FREE_LEVEL_LIMIT) {
    ui.showLoginGate();
    return;
  }

  levelIndex = next >= levels.length ? 0 : next;
  rewardedThisLevel = false;
  game.setLevel(levels[levelIndex]);
}

boot();