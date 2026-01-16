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

/* =====================================================
   GLOBAL STATE (UNCHANGED)
===================================================== */
const BACKEND = "https://adventuremaze.onrender.com";

let IS_LOGGED_IN = false;
let CURRENT_USER = { username: "guest", uid: null };
let CURRENT_ACCESS_TOKEN = null;

let ui = null;
let game = null;

let levelIndex = 0;
let LAST_UNLOCKED_LEVEL = 1;
let COINS = 0;
let rewardedThisLevel = false;

/* =====================================================
   HELPERS (UNCHANGED)
===================================================== */
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

async function readRes(res) {
  const txt = await res.text().catch(() => "");
  try {
    return { data: txt ? JSON.parse(txt) : {} };
  } catch {
    return { data: {} };
  }
}

/* =====================================================
   API CALLS (UNCHANGED)
===================================================== */
async function apiGetMe() {
  const res = await fetch(`${BACKEND}/api/me`, {
    headers: authHeaders(),
  });
  const { data } = await readRes(res);
  if (!res.ok || !data.ok) throw new Error("api/me failed");
  return data;
}

/* =====================================================
   LOGIN FLOW (FIXED ORDER)
===================================================== */
async function continueAfterLogin() {
  const me = await apiGetMe();

  CURRENT_USER = me.user;
  CURRENT_ACCESS_TOKEN = me.accessToken || CURRENT_ACCESS_TOKEN;
  IS_LOGGED_IN = true;

  LAST_UNLOCKED_LEVEL = me.progress?.level || 1;
  COINS = Number(me.user.coins || 0);

  ui.setCoins(COINS);

  levelIndex = clampLevelIndex(LAST_UNLOCKED_LEVEL - 1);

  ui.hideBootOverlay();
  ui.showWelcomeScreen();
}

/* =====================================================
   GAME FLOW
===================================================== */
function startGame() {
  if (!IS_LOGGED_IN) {
    console.warn("Game start blocked: not logged in");
    return;
  }

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

function onLevelComplete() {
  ui.showWinPopup?.({
    levelNumber: levelIndex + 1,
    isLastLevel: levelIndex >= levels.length - 1,
  });
}

/* =====================================================
   BOOT (THIS IS THE ONLY TOP-LEVEL CALL)
===================================================== */
async function boot() {
  // 1️⃣ UI FIRST (CRITICAL)
  ui = mountUI(document.querySelector("#app"));

  // 2️⃣ Audio unlock
  ui.onFirstUserGesture(() => ensureAudioUnlocked());

  // 3️⃣ Settings sync
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

  // 4️⃣ Pi environment
  const env = await enforcePiEnvironment({
    desktopBlockEl: document.getElementById("desktopBlock"),
  });
  if (!env.ok) return;

  initPi();

  // 5️⃣ LOGIN TRIGGER (Tap to continue)
  ui.onLoginGateClick(async () => {
    try {
      ui.showBootOverlay("Logging in...");

      const loginRes = await ensurePiLogin({
        BACKEND,
        ui,
        onLogin: ({ user, accessToken }) => {
          CURRENT_USER = user;
          CURRENT_ACCESS_TOKEN = accessToken;
        },
      });

      if (!loginRes?.ok) {
        ui.showBootOverlay("Login failed. Tap to retry");
        return;
      }

      await continueAfterLogin();
    } catch (e) {
      console.error(e);
      ui.showBootOverlay("Login error. Tap to retry");
    }
  });

  // 6️⃣ WELCOME → GAME
  ui.onWelcomeContinue(async () => {
    await delay(5000);
    startGame();
  });
}

boot();