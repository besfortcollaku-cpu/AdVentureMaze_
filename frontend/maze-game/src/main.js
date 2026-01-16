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
function authHeaders() {
  if (!CURRENT_ACCESS_TOKEN) throw new Error("No token");
  return { Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}` };
}

function clampLevelIndex(i) {
  if (i < 0) return 0;
  if (i >= levels.length) return 0;
  return i;
}

// ---------------------------
async function apiGetMe() {
  const res = await fetch(`${BACKEND}/api/me`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error("me failed");
  return data;
}

// ---------------------------
async function continueAfterLogin() {
  const me = await apiGetMe();

  CURRENT_USER = me.user;
  CURRENT_ACCESS_TOKEN = me.accessToken || CURRENT_ACCESS_TOKEN;
  IS_LOGGED_IN = true;

  COINS = Number(me.user.coins || 0);
  ui.setCoins(COINS);

  LAST_UNLOCKED_LEVEL = me.progress?.level || 1;
  levelIndex = clampLevelIndex(LAST_UNLOCKED_LEVEL - 1);

  ui.hideBootOverlay();
  ui.showWelcomeScreen();
}

// ---------------------------
function startGame() {
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

  // 🔴 TAP → LOGIN
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
        },
      });

      if (!res?.ok) {
        ui.showBootOverlay("Login failed. Tap again");
        return;
      }

      await continueAfterLogin();
    } catch {
      ui.showBootOverlay("Login error. Tap again");
    }
  });

  // 🔴 TAP WELCOME → GAME
  ui.onWelcomeContinue(() => {
    if (!IS_LOGGED_IN) return;
    startGame();
  });

  ui.onWinNext(() => {
    ui.hideWinPopup();
    levelIndex = clampLevelIndex(levelIndex + 1);
    game.setLevel(levels[levelIndex]);
  });
}

function onLevelComplete() {
  ui.showWinPopup();
}

boot();