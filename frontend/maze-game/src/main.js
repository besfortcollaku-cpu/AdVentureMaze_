// src/main.js
import "./css/ui.css";

import { mountUI } from "./ui/ui.js";
import { enforcePiEnvironment } from "./pi/piDetect.js";
import { initPi } from "./pi/piInit.js";
import { ensurePiLogin } from "./pi/piClient.js";

import { createGame } from "./game/game.js";
import { levels } from "./levels/index.js";

import { getSettings, setSetting, subscribeSettings } from "./settings.js";
import { ensureAudioUnlocked, stopRollSound } from "./game/rollSound.js";

const BACKEND = "https://adventuremaze.onrender.com";

// ---------------------------
// GLOBAL STATE
// ---------------------------
let CURRENT_USER = { username: "guest", uid: null };
let IS_GUEST = true;

let levelIndex = 0;
let game = null;
let ui = null;

// ---------------------------
// BOOT
// ---------------------------
async function boot() {
  const root = document.querySelector("#app");
  if (!root) {
    document.body.innerHTML = "<h1>#app not found</h1>";
    return;
  }

  // UI
  ui = mountUI(root);
// 🔥 FORCE canvas size (critical)
const canvas = ui.canvas;
const rect = canvas.getBoundingClientRect();

canvas.width = Math.floor(rect.width);
canvas.height = Math.floor(rect.height);

console.log("Canvas size:", canvas.width, canvas.height);
  // Audio unlock
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

  // Pi environment (DO NOT BLOCK GUEST)
  await enforcePiEnvironment({
    desktopBlockEl: document.getElementById("desktopBlock"),
  });

  // Init Pi SDK (no login yet)
  initPi();

  // ---------------------------
  // CREATE GAME (ONCE)
  // ---------------------------
  game = createGame({
    BACKEND,
    canvas: ui.canvas,
    getCurrentUser: () => CURRENT_USER,
    level: levels[levelIndex],
    onLevelComplete() {},
  });

  ui.setLevel(1);
  requestAnimationFrame(() => {
  game.start();
});

  // ---------------------------
  // WELCOME → GUEST
  // ---------------------------
  ui.onGuestStart(() => {
    IS_GUEST = true;
    CURRENT_USER = { username: "guest", uid: null };

    ui.setUser(CURRENT_USER);
    ui.hideWelcome();
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
    } catch (err) {
      ui.showLoginError(err?.message || "Login failed");
    }
  });
}

boot();