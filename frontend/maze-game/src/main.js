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

let CURRENT_USER = null;
let CURRENT_ACCESS_TOKEN = null;

let levelIndex = 0;
let game = null;
let ui = null;
let COINS = 0;
let rewardedThisLevel = false;

// 🆕 PATCH: track unlocked progress globally
let UNLOCKED_LEVEL = 1;

// ---------------------------
// Backend helpers
// ---------------------------
function authHeaders() {
  if (!CURRENT_ACCESS_TOKEN) {
    throw new Error("Missing access token. Please login again.");
  }
  return { Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}` };
}

async function readRes(res) {
  const txt = await res.text().catch(() => "");
  let data = {};
  try {
    data = txt ? JSON.parse(txt) : {};
  } catch {}
  return { txt, data };
}

async function apiGetMe() {
  const res = await fetch(`${BACKEND}/api/me`, {
    headers: authHeaders(),
  });
  const { data } = await readRes(res);
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || "api/me failed");
  }
  return data;
}

async function apiSetProgress({ uid, level, coins }) {
  await fetch(`${BACKEND}/progress`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ uid, level, coins }),
  });
}

async function apiClaimLevelComplete(level) {
  const res = await fetch(`${BACKEND}/api/rewards/level-complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ level }),
  });
  const { data } = await readRes(res);
  if (!res.ok || !data?.ok) throw new Error(data?.error);
  return data;
}

// ---------------------------
// Boot
// ---------------------------
async function boot() {
  ui = mountUI(document.querySelector("#app"));

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

  initPi();

  // ---------------------------
  // 🔐 PI LOGIN FLOW
  // ---------------------------
  if (!window.Pi?.authenticate) {
    alert("This game works only inside Pi Browser.");
    return;
  }

  async function onAuthSuccess(auth) {
    CURRENT_ACCESS_TOKEN = auth.accessToken;

    const me = await apiGetMe();

    CURRENT_USER = {
      uid: me.user.uid,
      username: me.user.username,
    };

    COINS = Number(me.user.coins || 0);
    ui.setCoins(COINS);
    ui.setUser({ username: me.user.username });

    const savedLevel = Number(me.progress?.level || 1);

    levelIndex = Math.max(0, savedLevel - 1);
    UNLOCKED_LEVEL = savedLevel; // 🆕 PATCH

    // 🆕 PATCH: show welcome instead of immediately starting
    ui.showWelcome();

    ui.onWelcomeStart(() => {
      ui.hideWelcome();

      ui.showLevelSelect({
        totalLevels: levels.length,
        currentLevel: levelIndex + 1,
        isCompleted: (lvl) => lvl < UNLOCKED_LEVEL,
      });

      startGame();
    });
  }

  try {
    const auth = await Pi.authenticate([], {
      onIncompletePaymentFound: () => {},
    });
    await onAuthSuccess(auth);
  } catch {
    ui.showLoginGate();
    ui.onLoginClick(async () => {
      try {
        const auth = await Pi.authenticate([], {
          onIncompletePaymentFound: () => {},
        });
        ui.hideLoginGate();
        await onAuthSuccess(auth);
      } catch {
        ui.showLoginError("Login failed. Please try again.");
      }
    });
  }

  // 🆕 PATCH: joystick opens level select safely
  document.getElementById("controls")?.addEventListener("click", () => {
    ui.showLevelSelect({
      totalLevels: levels.length,
      currentLevel: levelIndex + 1,
      isCompleted: (lvl) => lvl < UNLOCKED_LEVEL,
    });
  });
}

// ---------------------------
// Game
// ---------------------------
function startGame() {
  rewardedThisLevel = false;

  game = createGame({
    BACKEND,
    canvas: ui.canvas,
    getCurrentUser: () => CURRENT_USER,
    level: levels[levelIndex],
    onLevelComplete,
  });

  game.start();
}

function onLevelComplete() {
  const isLastLevel = levelIndex >= levels.length - 1;

  if (!rewardedThisLevel) {
    rewardedThisLevel = true;
    apiClaimLevelComplete(levelIndex + 1)
      .then((out) => {
        COINS = Number(out?.user?.coins ?? COINS);
        ui.setCoins(COINS);
      })
      .catch(console.warn);
  }

  const nextLevel = isLastLevel ? 1 : levelIndex + 2;
  UNLOCKED_LEVEL = Math.max(UNLOCKED_LEVEL, nextLevel); // 🆕 PATCH

  apiSetProgress({
    uid: CURRENT_USER.uid,
    level: nextLevel,
    coins: COINS,
  }).catch(console.warn);

  ui.showWinPopup({
    levelNumber: levelIndex + 1,
    isLastLevel,
  });
}

boot();