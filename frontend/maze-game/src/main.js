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

function authHeaders() {
  if (!CURRENT_ACCESS_TOKEN) throw new Error("Missing access token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}`,
  };
}

async function apiGetMe() {
  const r = await fetch(`${BACKEND}/api/me`, { headers: authHeaders() });
  const j = await r.json();
  if (!r.ok || !j.ok) throw new Error(j.error || "api/me failed");
  return j;
}

async function apiLevelComplete(level) {
  const r = await fetch(`${BACKEND}/api/rewards/level-complete`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ level }),
  });
  const j = await r.json();
  if (!r.ok || !j.ok) throw new Error(j.error || "level-complete failed");
  return j;
}

async function apiSkip() {
  const r = await fetch(`${BACKEND}/api/skip`, { method: "POST", headers: authHeaders() });
  const j = await r.json();
  if (!r.ok || !j.ok) throw new Error(j.error || "skip failed");
  return j;
}

async function apiHint() {
  const r = await fetch(`${BACKEND}/api/hint`, { method: "POST", headers: authHeaders() });
  const j = await r.json();
  if (!r.ok || !j.ok) throw new Error(j.error || "hint failed");
  return j;
}

function clampLevelIndex(i) {
  if (i < 0) return 0;
  if (i >= levels.length) return 0;
  return i;
}

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
  CURRENT_USER = me.user;
  COINS = Number(me.user.coins || 0);
  ui.setCoins(COINS);

  levelIndex = clampLevelIndex((me.progress?.level || 1) - 1);

  ui.onWinNext(async () => {
    ui.hideWinPopup();
    await goNextLevel();
  });

  ui.onWinAd(async () => {
    ui.hideWinPopup();
    await goNextLevel();
  });

  ui.onSkip(async () => {
    const out = await apiSkip();
    COINS = out.user.coins;
    ui.setCoins(COINS);
  });

  ui.onHint(async () => {
    const out = await apiHint();
    COINS = out.user.coins;
    ui.setCoins(COINS);
  });

  game = createGame({
    canvas: ui.canvas,
    level: levels[levelIndex],
    onLevelComplete,
  });

  game.start();
}

async function onLevelComplete({ level }) {
  const out = await apiLevelComplete(level);
  if (!out.already) {
    COINS = out.user.coins;
    ui.setCoins(COINS);
  }

  ui.showWinPopup({
    levelNumber: level,
    isLastLevel: levelIndex >= levels.length - 1,
  });
}

async function goNextLevel() {
  levelIndex++;
  if (levelIndex >= levels.length) levelIndex = 0;
  game.setLevel(levels[levelIndex]);
}

boot();
