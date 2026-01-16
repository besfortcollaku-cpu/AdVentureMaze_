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

let IS_LOGGED_IN = false;
let LAST_UNLOCKED_LEVEL = 1;

let levelIndex = 0;
let game = null;
let ui = null;

let COINS = 0;
let rewardedThisLevel = false;

// ---------------------------
// Helpers
// ---------------------------
function authHeaders() {
  if (!CURRENT_ACCESS_TOKEN) {
    throw new Error("Missing access token");
  }
  return { Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}` };
}

function clampLevelIndex(i) {
  if (i < 0) return 0;
  if (i >= levels.length) return 0;
  return i;
}

function delay(ms = 5000) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------
// API
// ---------------------------
async function apiGetMe() {
  const res = await fetch(`${BACKEND}/api/me`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error("api/me failed");
  return data;
}

async function apiSetProgress({ uid, level, coins }) {
  const res = await fetch(`${BACKEND}/progress`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ uid, level, coins }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error("progress failed");
  return data;
}

async function apiClaimLevelComplete(levelNumber) {
  const res = await fetch(`${BACKEND}/api/rewards/level-complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ level: levelNumber }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error("reward failed");
  return data;
}

// ---------------------------
// Flow
// ---------------------------
async function continueAfterLogin() {
  const me = await apiGetMe();

  LAST_UNLOCKED_LEVEL = me.progress?.level || 1;
  levelIndex = clampLevelIndex(LAST_UNLOCKED_LEVEL - 1);

  CURRENT_USER = me.user;
  CURRENT_ACCESS_TOKEN = me.accessToken || CURRENT_ACCESS_TOKEN;
  IS_LOGGED_IN = true;

  COINS = Number(me.user.coins || 0);
  ui.setCoins(COINS);

  ui.hideBootOverlay();
  ui.showWelcomeScreen();
}

function startGameAfterLogin() {
  ui.hideWelcomeScreen();

  rewardedThisLevel = false;

  if (!game) {
    game = createGame({
      BACKEND,
      canvas: ui.canvas,
      getCurrentUser: () => CURRENT_USER,
      level: levels[levelIndex],
      onLevelComplete,
    });
    game.start();
  } else {
    game.setLevel(levels[levelIndex]);
  }
}

// ---------------------------
// Boot
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

  ui.onLoginGateClick(async () => {
    if (IS_LOGGED_IN) return;

    try {
      ui.showBootOverlay("Logging in...");

      const res = await ensurePiLogin({
        BACKEND,
        ui,
        onLogin: ({ user, accessToken }) => {
          CURRENT_USER = user;
          CURRENT_ACCESS_TOKEN = accessToken;
          IS_LOGGED_IN = true;
          ui.setUser?.(user);
        },
      });

      if (!res?.ok) {
        ui.showBootOverlay("Login failed. Tap to retry");
        return;
      }

      await continueAfterLogin();
    } catch (e) {
      ui.showBootOverlay("Login error. Tap to retry");
    }
  });

  ui.onWelcomeContinue(() => {
    if (!IS_LOGGED_IN) return;
    startGameAfterLogin();
  });

  ui.onWinNext(async () => {
    ui.hideWinPopup();
    await goNextLevel();
  });
}

function onLevelComplete() {
  if (!rewardedThisLevel) {
    rewardedThisLevel = true;
    apiClaimLevelComplete(levelIndex + 1)
      .then((out) => {
        COINS = Number(out.user.coins || COINS);
        ui.setCoins(COINS);
      })
      .catch(() => {});
  }

  const nextLevel = levelIndex + 2;

  apiSetProgress({
    uid: CURRENT_USER.uid,
    level: nextLevel,
    coins: COINS,
  }).catch(() => {});

  ui.showWinPopup({
    levelNumber: levelIndex + 1,
    isLastLevel: levelIndex >= levels.length - 1,
  });
}

async function goNextLevel() {
  levelIndex = clampLevelIndex(levelIndex + 1);
  rewardedThisLevel = false;

  game.setLevel(levels[levelIndex]);

  try {
    await apiSetProgress({
      uid: CURRENT_USER.uid,
      level: levelIndex + 1,
      coins: COINS,
    });
  } catch {}
}

boot();