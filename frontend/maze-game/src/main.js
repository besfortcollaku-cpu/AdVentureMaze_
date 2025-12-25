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

let levelIndex = 0;
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

  const firstLevel = levels[levelIndex];

  game = createGame({
    BACKEND,
    canvas: ui.canvas,
    getCurrentUser: () => CURRENT_USER,
    level: firstLevel,
    onLevelComplete: () => {
      // your existing level complete logic stays as-is
    },
  });

  game.start();
}

boot();