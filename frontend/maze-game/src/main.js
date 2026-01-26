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

const root = document.querySelector("#app");
const ui = mountUI(root);

// 🔴 HARD RENDER TEST
const ctx = ui.canvas.getContext("2d");

ui.canvas.width = ui.canvas.clientWidth;
ui.canvas.height = ui.canvas.clientHeight;

ctx.fillStyle = "red";
ctx.fillRect(20, 20, 100, 100);

console.log("TEST DRAW DONE", ui.canvas.width, ui.canvas.height);
const BACKEND = "https://adventuremaze.onrender.com";

// ---------------------------
// GLOBAL STATE
// ---------------------------
let CURRENT_USER = { username: "guest", uid: null };
let IS_GUEST = true;

let levelIndex = 0;
let game = null;

// ---------------------------
// BOOT
// ---------------------------
async function boot() {
  const root = document.querySelector("#app");
  if (!root) {
    document.body.innerHTML = "<h1>#app not found</h1>";
    return;
  }

  

  // Audio unlock (mobile safe)
  ui.onFirstUserGesture(() => ensureAudioUnlocked());

  // Settings
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

  // Pi environment (does NOT block guest)
  await enforcePiEnvironment({
    desktopBlockEl: document.getElementById("desktopBlock"),
  });

  // Init Pi SDK (NO LOGIN)
  initPi();

  // ---------------------------
  // WELCOME → GUEST
  // ---------------------------
  ui.onGuestStart(() => {
    IS_GUEST = true;
    CURRENT_USER = { username: "guest", uid: null };

    ui.setUser(CURRENT_USER);
    ui.hideWelcome();

    startGame();
  });

  // ---------------------------
  // WELCOME → LOGIN
  // ---------------------------
  ui.onLoginClick(async () => {
    try {
      const user = await ensurePiLogin();

      IS_GUEST = false;
      CURRENT_USER = user;

      ui.setUser(user);
      ui.hideWelcome();

      startGame();
    } catch (err) {
      ui.showLoginError(err?.message || "Login failed");
    }
  });
}

// ---------------------------
// GAME START (ONCE)
// ---------------------------
function startGame() {
  if (game) return; // 🔒 never create twice

  levelIndex = 0;

  game = createGame({
    BACKEND,
    canvas: ui.canvas,
    getCurrentUser: () => CURRENT_USER,
    level: levels[levelIndex],
    onLevelComplete,
  });

  game.start();
  ui.setLevel(1);

  // Level select
  document.getElementById("controls")?.addEventListener("click", () => {
    ui.showLevelSelect({
      totalLevels: levels.length,
      currentLevel: levelIndex + 1,
      isCompleted: (lvl) => lvl <= levelIndex + 1,
    });
  });

  ui.onLevelSelect((selectedIndex) => {
    levelIndex = selectedIndex;
    game.setLevel(levels[levelIndex]);
    game.start();
    ui.setLevel(levelIndex + 1);
  });
}

// ---------------------------
// LEVEL COMPLETE
// ---------------------------
function onLevelComplete() {
  const isLast = levelIndex >= levels.length - 1;

  ui.showWinPopup({
    levelNumber: levelIndex + 1,
    isLastLevel: isLast,
  });

  ui.onWinNext(() => {
    ui.hideWinPopup();

    if (!isLast) {
      levelIndex++;
      game.setLevel(levels[levelIndex]);
      game.start();
      ui.setLevel(levelIndex + 1);
    } else {
      levelIndex = 0;
      game.setLevel(levels[0]);
      game.start();
      ui.setLevel(1);
    }
  });
}

// ---------------------------
boot();