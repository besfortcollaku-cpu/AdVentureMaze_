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
let FREE_HINTS = 0;
let FREE_SKIPS = 0;

let rewardedThisLevel = false;

// ---------------------------
// Backend helpers (SAFE)
// ---------------------------
function authHeaders() {
  if (!CURRENT_ACCESS_TOKEN) return {};
  return { Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}` };
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function readRes(res) {
  const txt = await res.text().catch(() => "");
  let data = {};
  try {
    data = txt ? JSON.parse(txt) : {};
  } catch {}
  return { data };
}

// ---------------------------
// Boot
// ---------------------------
async function boot() {
  ui = mountUI(document.querySelector("#app"));

  if (ui.onFirstUserGesture) {
    ui.onFirstUserGesture(() => ensureAudioUnlocked());
  }

  // settings (unchanged)
  const s0 = getSettings();
  ui.onSoundToggle((v) => {
    setSetting("sound", v);
    if (!v) stopRollSound();
  });
  ui.onVibrationToggle((v) => setSetting("vibration", v));
  subscribeSettings((s) => {
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

  if (!CURRENT_ACCESS_TOKEN) return;

  const res = await fetch(`${BACKEND}/api/me`, {
    headers: authHeaders(),
  });
  const { data } = await readRes(res);

  COINS = Number(data.user.coins || 0);
  FREE_HINTS = Number(data.user.freeHintsLeft || 0);
  FREE_SKIPS = Number(data.user.freeSkipsLeft || 0);

  ui.setCoins(COINS);
  ui.setHintCount(FREE_HINTS);
  ui.setSkipCount(FREE_SKIPS);

  // ---------------------------
  // Hint / Skip logic (NEW)
  // ---------------------------
  document.getElementById("hintBtn").onclick = () => {
    ui.openActionPopup({
      type: "hint",
      freeLeft: FREE_HINTS,
      coins: COINS,
      onFree: async () => {
        await fetch(`${BACKEND}/api/hint`, {
          method: "POST",
          headers: authHeaders(),
        });
        FREE_HINTS--;
        ui.setHintCount(FREE_HINTS);
      },
      onPaid: async () => {
        await fetch(`${BACKEND}/api/hint`, {
          method: "POST",
          headers: authHeaders(),
        });
        COINS -= 50;
        ui.setCoins(COINS);
      },
      onAd: async () => {
        await delay(3000);
        await fetch(`${BACKEND}/api/hint`, {
          method: "POST",
          headers: authHeaders(),
        });
      },
    });
  };

  document.getElementById("x3Btn").onclick = () => {
    ui.openActionPopup({
      type: "skip",
      freeLeft: FREE_SKIPS,
      coins: COINS,
      onFree: async () => {
        await fetch(`${BACKEND}/api/skip`, {
          method: "POST",
          headers: authHeaders(),
        });
        FREE_SKIPS--;
        ui.setSkipCount(FREE_SKIPS);
        goNextLevel();
      },
      onPaid: async () => {
        await fetch(`${BACKEND}/api/skip`, {
          method: "POST",
          headers: authHeaders(),
        });
        COINS -= 50;
        ui.setCoins(COINS);
        goNextLevel();
      },
      onAd: async () => {
        await delay(3000);
        await fetch(`${BACKEND}/api/skip`, {
          method: "POST",
          headers: authHeaders(),
        });
        goNextLevel();
      },
    });
  };

  // ---------------------------
  // Game setup (unchanged)
  // ---------------------------
  const firstLevel = levels[levelIndex];
  rewardedThisLevel = false;

  game = createGame({
    canvas: ui.canvas,
    level: firstLevel,
    onLevelComplete,
  });

  game.start();
}

function goNextLevel() {
  levelIndex = (levelIndex + 1) % levels.length;
  game.setLevel(levels[levelIndex]);
}

function onLevelComplete() {
  ui.showWinPopup({
    levelNumber: levelIndex + 1,
    isLastLevel: levelIndex >= levels.length - 1,
  });
}

boot();