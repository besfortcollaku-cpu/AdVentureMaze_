// IMPORTS 1
import "./style.css";
import { enforcePiEnvironment } from "./pi/piDetect.js";
import { initPi } from "./pi/piInit.js";
import { ensurePiLogin } from "./pi/piClient.js";

import { createLoginUI } from "./ui/uiLogin.js";
import { mountWelcomeUI } from "./ui/uiWelcome.js";
import { mountGameShell } from "./ui/uiGameShell.js";

import { createGame } from "./game/game.js";
import { levels } from "./levels/index.js";

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

        // ▶️ TAP TO PLAY
        welcomeUI.onStart(() => {
  welcomeUI.hide();

  // 1️⃣ Mount GameShell
  gameShell = mountGameShell(root);

  // HUD
  gameShell.setLevelText("Level 1");
  gameShell.setCoins(CURRENT_USER?.coins ?? 0);

  // 2️⃣ Destroy previous game (safety)
  if (CURRENT_GAME) {
    CURRENT_GAME.stop?.();
    CURRENT_GAME = null;
  }

  // 3️⃣ Create game
  CURRENT_GAME = createGame({
    canvas: gameShell.canvas,
    level: loadLevel(1),
    onLevelComplete: () => {
      console.log("🏁 Level 1 complete");
    },
  });

  // 4️⃣ START GAME LOOP ✅
  CURRENT_GAME.start();
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