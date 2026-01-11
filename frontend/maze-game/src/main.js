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

let levelIndex = 0;
let game = null;
let ui = null;
let UNLOCKED_LEVEL = 1;

let COINS = 0;
let rewardedThisLevel = false;
let LOGIN_READY = false;

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

function delay(ms = 5000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  const res = await fetch(`${BACKEND}/api/me`, { headers: authHeaders() });
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
  return data;
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
    headers: authHeaders(),
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
    headers: authHeaders(),
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

  // joystick → level select
  document.getElementById("controls")?.addEventListener("click", () => {
    if (!CURRENT_USER?.uid) return;
    ui.showLevelSelect({
      totalLevels: levels.length,
      currentLevel: levelIndex + 1,
      isCompleted: (lvl) => lvl <= UNLOCKED_LEVEL,
    });
  });

  ui.onLevelSelect((selectedIndex) => {
    if (!game) return;
    ui.hideLevelSelect();
    ui.showGame();
    levelIndex = clampLevelIndex(selectedIndex);
    rewardedThisLevel = true;
    game.setLevel(levels[levelIndex]);
    game.start();
  });

  ui.onFirstUserGesture(() => ensureAudioUnlocked());

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

  const env = await enforcePiEnvironment({
    desktopBlockEl: document.getElementById("desktopBlock"),
  });
  if (!env.ok) return;

  initPi();

  await ensurePiLogin({
    BACKEND,
    ui,
    onLogin: ({ user, accessToken }) => {
      CURRENT_USER = user;
      CURRENT_ACCESS_TOKEN = accessToken;
      ui.setUser(user);
    },
  });

  let me;
  try {
    me = await apiGetMe();
  } catch (e) {
    const msg = normalizeErr(e);
    if (!handleAuthExpiredIfNeeded(msg)) alert(msg);
    return;
  }

  COINS = Number(me.user.coins || 0);
  ui.setCoins(COINS);

  const savedLevel = Number(me.progress?.level || 1);
  levelIndex = clampLevelIndex(savedLevel - 1);
  UNLOCKED_LEVEL = savedLevel;

  LOGIN_READY = true;
  ui.showWelcome(savedLevel > 1);

  ui.onWelcomeStart(() => {
    if (!LOGIN_READY) return;
    ui.hideWelcome();
    ui.showGame(); // ✅ REQUIRED FIX
    ui.showLevelSelect({
      totalLevels: levels.length,
      currentLevel: levelIndex + 1,
      isCompleted: (lvl) => lvl <= UNLOCKED_LEVEL,
    });
  });

  game = createGame({
    BACKEND,
    canvas: ui.canvas,
    getCurrentUser: () => CURRENT_USER,
    level: levels[levelIndex],
    onLevelComplete,
  });
}

// ---------------------------
// Level flow
// ---------------------------
function onLevelComplete() {
  const isLastLevel = levelIndex >= levels.length - 1;

  if (!rewardedThisLevel) {
    rewardedThisLevel = true;
    apiClaimLevelComplete(levelIndex + 1).then((out) => {
      COINS = Number(out?.user?.coins ?? COINS);
      ui.setCoins(COINS);
    });
  }

  ui.showWinPopup({
    levelNumber: levelIndex + 1,
    isLastLevel,
  });
}

boot().catch(console.error);