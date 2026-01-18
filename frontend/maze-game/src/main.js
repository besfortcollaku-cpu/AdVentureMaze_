// src/main.js

// IMPORTS
import { enforcePiEnvironment } from "./pi/piDetect.js";
import { initPi } from "./pi/piInit.js";
import { ensurePiLogin } from "./pi/piClient.js";

import { createLoginUI } from "./ui/uiLogin.js";
import { mountWelcomeUI } from "./ui/uiWelcome.js";
import { mountLevelsUI } from "./ui/uiLevels.js";
import { mountGameShell } from "./ui/uiGameShell.js";

import { createGame } from "./game/game.js";
import { loadLevel } from "./levels/index.js";

// CONFIG
const BACKEND = "https://adventuremaze.onrender.com";

let CURRENT_USER = null;
let CURRENT_ACCESS_TOKEN = null;

// 🔑 SINGLE game instance
let game = null;
let gameShell = null;

async function boot() {
  // 1️⃣ Enforce Pi environment
  const env = await enforcePiEnvironment({
    desktopBlockEl: document.getElementById("desktopBlock"),
  });
  if (!env.ok) return;

  // 2️⃣ Init Pi SDK
  initPi();

  // 3️⃣ Root + Login UI
  const root = document.querySelector("#app");
  const loginUI = createLoginUI(root);

  loginUI.show("Tap to continue");

  // 4️⃣ Handle login
  loginUI.onLogin(async () => {
    loginUI.setText("Logging in…");
    loginUI.showSpinner();

    try {
      const loginRes = await ensurePiLogin({
        BACKEND,
        onLogin: ({ user, accessToken }) => {
          CURRENT_USER = user;
          CURRENT_ACCESS_TOKEN = accessToken;
          console.log("✅ LOGGED IN:", user);
        },
      });

      if (!loginRes?.ok) {
        loginUI.hideSpinner();
        loginUI.setText("Login failed. Tap to retry");
        return;
      }

      // ✅ Login success
      setTimeout(() => {
        loginUI.hideSpinner();
        loginUI.hide();

        // 5️⃣ Welcome screen
        const welcomeUI = mountWelcomeUI(root, CURRENT_USER);
        welcomeUI.show();

        // ▶️ TAP TO PLAY = START GAME
        welcomeUI.onStart(() => {
          welcomeUI.hide();

          // 6️⃣ Mount GameShell ONCE
          gameShell = mountGameShell(root);
          gameShell.setCoins(CURRENT_USER.coins || 0);

          const startLevelNumber = CURRENT_USER.level || 1;
          const startLevel = loadLevel(startLevelNumber);

          gameShell.setLevelText(`Level ${startLevelNumber}`);

          // 7️⃣ Create & start game ONCE
          game = createGame({
            canvas: gameShell.canvas,
            level: startLevel,
            user: CURRENT_USER,
            backend: BACKEND,
            onLevelComplete: () => {
              console.log("🏁 Level completed:", startLevelNumber);
            },
          });

          game.start();

          // 8️⃣ Mount Levels UI (overlay only)
          mountLevelsUI(root, {
            unlockedLevels: CURRENT_USER.level || 1,
            completedLevels: CURRENT_USER.completedLevels || [],
            onSelectLevel: handleLevelSelect,
          });
        });
      }, 400);
    } catch (err) {
      console.error("Login error:", err);
      loginUI.hideSpinner();
      loginUI.setText("Login error. Tap to retry");
    }
  });
}

// 🔁 LEVEL JUMP ONLY (NO GAME RESTART)
function handleLevelSelect(levelNumber) {
  console.log("🎯 Jump to level:", levelNumber);

  if (!game) {
    console.error("Game not started yet");
    return;
  }

  const levelData = loadLevel(levelNumber);
  if (!levelData) {
    console.error("Level not found:", levelNumber);
    return;
  }

  // close levels overlay
  document.querySelector(".levelsOverlay")?.remove();

  game.loadLevel(levelData);
  gameShell.setLevelText(`Level ${levelNumber}`);
}

// 🚀 START APP
boot();