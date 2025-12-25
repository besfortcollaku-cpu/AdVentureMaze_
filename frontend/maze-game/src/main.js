// src/main.js
import "./style.css";

import { mountUI } from "./ui/ui.js";
import { setupPiLogin } from "./pi/piClient.js";
import { enforcePiEnvironment } from "./pi/piDetect.js";
import { createGame } from "./game/game.js";
import { levels } from "./levels/index.js";

import { getSettings, setSetting, subscribeSettings } from "./settings.js";

const BACKEND = "https://adventuremaze.onrender.com";

let CURRENT_USER = { username: "guest", uid: null };
let CURRENT_ACCESS_TOKEN = null;

// ---------------------------
// STEP 1: Persist level index
// ---------------------------
const LEVEL_KEY = "levelIndex";

function clampLevelIndex(i) {
  const n = Array.isArray(levels) ? levels.length : 0;
  if (!n) return 0;
  const x = Number.isFinite(i) ? i : 0;
  return Math.max(0, Math.min(n - 1, x));
}

function loadSavedLevelIndex() {
  const raw = localStorage.getItem(LEVEL_KEY);
  const i = raw == null ? 0 : parseInt(raw, 10);
  return clampLevelIndex(Number.isFinite(i) ? i : 0);
}

function saveLevelIndex(i) {
  localStorage.setItem(LEVEL_KEY, String(clampLevelIndex(i)));
}

let levelIndex = loadSavedLevelIndex();
saveLevelIndex(levelIndex); // keep storage clean (clamped)
let game = null;

async function boot() {
  const ui = mountUI(document.querySelector("#app"));

  // init toggles from saved settings
  const s0 = getSettings();
  ui.setSoundEnabled(s0.sound);
  ui.setVibrationEnabled(s0.vibration);

  // when user toggles
  ui.onSoundToggle((v) => setSetting("sound", v));
  ui.onVibrationToggle((v) => setSetting("vibration", v));

  // keep UI in sync if settings changed elsewhere
  subscribeSettings((s) => {
    ui.setSoundEnabled(s.sound);
    ui.setVibrationEnabled(s.vibration);
  });

  // Pi environment
  const env = await enforcePiEnvironment({
    desktopBlockEl: document.getElementById("desktopBlock"),
  });
  if (!env.ok) return;

  // Pi login
  setupPiLogin({
    BACKEND,
    loginBtn: ui.loginBtn,
    loginBtnText: ui.loginBtnText,
    userPill: ui.userPill,
    onLogin: ({ user, accessToken }) => {
      CURRENT_USER = user;
      CURRENT_ACCESS_TOKEN = accessToken;
    },
  });

  // Load level from saved index
  levelIndex = clampLevelIndex(levelIndex);
  const firstLevel = levels[levelIndex];

  game = createGame({
    BACKEND,
    canvas: ui.canvas,
    getCurrentUser: () => CURRENT_USER,
    level: firstLevel,

    onLevelComplete: () => {
      // ✅ your existing level complete logic stays as-is
      // (when you do "Next Level", call goNextLevel() below)
    },
  });

  // OPTIONAL SAFE HOOK:
  // If your UI already has a Next button callback, wire it to goNextLevel().
  // This will NOT break if ui.onNextLevel doesn't exist.
  function goNextLevel() {
    levelIndex = clampLevelIndex(levelIndex + 1);
    saveLevelIndex(levelIndex);

    const next = levels[levelIndex];
    if (game && typeof game.setLevel === "function") {
      game.setLevel(next);
    }
  }

  if (typeof ui.onNextLevel === "function") {
    ui.onNextLevel(() => {
      goNextLevel();
    });
  }

  game.start();
}

boot();