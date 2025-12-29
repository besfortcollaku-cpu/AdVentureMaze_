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
let COINS = 0;

// ---------------------------
// helpers
// ---------------------------
function authHeaders() {
  if (!CURRENT_ACCESS_TOKEN) throw new Error("Missing access token");
  return {
    Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function apiGetMe() {
  const r = await fetch(`${BACKEND}/api/me`, { headers: authHeaders() });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || "api/me failed");
  return j;
}

async function apiSetProgress({ uid, level, coins }) {
  await fetch(`${BACKEND}/progress`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ uid, level, coins }),
  });
}

async function apiLevelComplete(level) {
  await fetch(`${BACKEND}/api/rewards/level-complete`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ level }),
  });
}

async function apiSkip() {
  const r = await fetch(`${BACKEND}/api/skip`, {
    method: "POST",
    headers: authHeaders(),
  });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error);
  COINS = j.user.coins;
  ui.setCoins(COINS);
}

async function apiHint() {
  const r = await fetch(`${BACKEND}/api/hint`, {
    method: "POST",
    headers: authHeaders(),
  });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error);
  COINS = j.user.coins;
  ui.setCoins(COINS);
}

function clampLevel(i) {
  if (i < 0) return 0;
  if (i >= levels.length) return 0;
  return i;
}

// ---------------------------
// boot
// ---------------------------
async function boot() {
  ui = mountUI(document.querySelector("#app"));

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

  const loginRes = await ensurePiLogin({
    BACKEND,
    ui,
    onLogin: ({ user, accessToken }) => {
      CURRENT_USER = user;
      CURRENT_ACCESS_TOKEN = accessToken;
      ui.userPill.textContent = `User: ${user.username}`;
      ui.loginBtnText.textContent = "Logged in ✅";
    },
  });
  if (!loginRes?.ok) return;

  const me = await apiGetMe();
  COINS = Number(me.user.coins || 0);
  ui.setCoins(COINS);

  levelIndex = clampLevel((me.progress?.level || 1) - 1);

  ui.onWinNext(async () => {
    ui.hideWinPopup();
    goNextLevel();
  });

  ui.onWinAd(async () => {
    await fetch(`${BACKEND}/api/rewards/ad-50`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ nonce: crypto.randomUUID() }),
    });
    const me2 = await apiGetMe();
    COINS = me2.user.coins;
    ui.setCoins(COINS);
    ui.hideWinPopup();
    goNextLevel();
  });

  ui.onSkip(async () => {
    try {
      await apiSkip();
      goNextLevel();
    } catch (e) {
      alert(e.message);
    }
  });

  ui.onHint(async () => {
    try {
      await apiHint();
      game.showHint();
    } catch (e) {
      alert(e.message);
    }
  });

  game = createGame({
    BACKEND,
    canvas: ui.canvas,
    getCurrentUser: () => CURRENT_USER,
    level: levels[levelIndex],
    onLevelComplete,
  });

  game.start();
}

// ---------------------------
// level flow
// ---------------------------
async function onLevelComplete() {
  const levelNumber = levelIndex + 1;

  apiLevelComplete(levelNumber).catch(() => {});

  apiSetProgress({
    uid: CURRENT_USER.uid,
    level: levelNumber + 1,
    coins: COINS,
  }).catch(() => {});

  ui.showWinPopup({
    levelNumber,
    isLastLevel: levelIndex >= levels.length - 1,
  });
}

function goNextLevel() {
  levelIndex = clampLevel(levelIndex + 1);
  game.setLevel(levels[levelIndex]);
}

boot();