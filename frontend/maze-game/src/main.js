// src/main.js

import { enforcePiEnvironment } from "./pi/piDetect.js";
import { initPi } from "./pi/piInit.js";
import { ensurePiLogin } from "./pi/piClient.js";

import { createLoginUI } from "./ui/uiLogin.js";
import { mountWelcomeUI } from "./ui/uiWelcome.js";
import { mountGameShell } from "./ui/uiGameShell.js";

import { createGame } from "./game/game.js";
import { loadLevel } from "./levels/index.js";

const BACKEND = "https://adventuremaze.onrender.com";

let CURRENT_USER = null;
let CURRENT_GAME = null;

async function boot() {
  const env = await enforcePiEnvironment({
    desktopBlockEl: document.getElementById("desktopBlock"),
  });
  if (!env.ok) return;

  initPi();

  const root = document.querySelector("#app");
  const loginUI = createLoginUI(root);

  loginUI.show("Tap to continue");

  loginUI.onLogin(async () => {
    loginUI.setText("Logging in…");
    loginUI.showSpinner();

    try {
      const res = await ensurePiLogin({
        BACKEND,
        onLogin: ({ user }) => {
          CURRENT_USER = user;
        },
      });

      if (!res?.ok) {
        loginUI.hideSpinner();
        loginUI.setText("Login failed. Tap to retry");
        return;
      }

      loginUI.hideSpinner();
      loginUI.hide();

      // ✅ WELCOME
      const welcomeUI = mountWelcomeUI(root, CURRENT_USER);
      welcomeUI.show();

      welcomeUI.onStart(() => {
        welcomeUI.hide();

        // 🔒 From this point on, ROOT MUST NEVER be replaced again

        // ✅ MOUNT GAME SHELL
        const gameUI = mountGameShell(root);

        gameUI.setLevelText("Level 1");
        gameUI.setCoins(CURRENT_USER?.coins ?? 0);

        // stop old game safely
        if (CURRENT_GAME?.stop) {
          CURRENT_GAME.stop();
        }

        // ✅ LOAD LEVEL 1
        const level = loadLevel(0);

        // ✅ CREATE GAME
        CURRENT_GAME = createGame({
          canvas: gameUI.canvas,
          level,
          onLevelComplete: () => {
            console.log("🏁 Level 1 complete");
          },
        });

        // 🚀 START GAME LOOP (THIS WAS MISSING EFFECTIVELY)
        CURRENT_GAME.start();
      });
    } catch (err) {
      console.error(err);
      loginUI.hideSpinner();
      loginUI.setText("Login error. Tap to retry");
    }
  });
}

boot();