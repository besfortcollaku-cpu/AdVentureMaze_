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
let CURRENT_GAME = null;

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

      // ❌ Login failed
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

        welcomeUI.onStart(() => {
          welcomeUI.hide();

          // 6️⃣ Levels screen
          mountLevelsUI(root, {
            unlockedLevels: CURRENT_USER.level || 1,
            completedLevels: CURRENT_USER.completedLevels || [],
            onSelectLevel: (levelIndex) => {
              console.log("🎯 Level selected:", levelIndex);

              // remove levels UI (overlay)
              document.querySelector(".levelsOverlay")?.remove();

              // 7️⃣ Mount game shell (canvas + HUD)
              const gameUI = mountGameShell(root);

              // optional HUD updates
              gameUI.setLevelText?.(`Level ${levelIndex + 1}`);
              gameUI.setCoins?.(CURRENT_USER.coins || 0);

              // stop previous game if any
              if (CURRENT_GAME?.destroy) {
                CURRENT_GAME.destroy();
              }

              // 8️⃣ Create & start game
              CURRENT_GAME = createGame({
                canvas: gameUI.canvas,
                level: levels[levelIndex],
                user: CURRENT_USER,
                backend: BACKEND,
                onLevelComplete: () => {
                  console.log("🏁 Level completed:", levelIndex + 1);
                },
              });

              CURRENT_GAME.start();
            },
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

// 🚀 START APP
boot();