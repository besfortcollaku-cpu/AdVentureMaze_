import "./style.css";
import { mountUI } from "./ui/ui.js";
import { enforcePiEnvironment } from "./pi/piDetect.js";
import { initPi } from "./pi/piInit.js";
import { ensurePiLogin } from "./pi/piClient.js";
import { createGame } from "./game/game.js";
import { levels } from "./levels/index.js";

let ui;
let game;
let IS_LOGGED_IN = false;
let CURRENT_USER = null;
let CURRENT_ACCESS_TOKEN = null;
let levelIndex = 0;
let COINS = 0;

async function continueAfterLogin() {
  ui.hideBootOverlay();
  ui.showWelcomeScreen();
}

function startGame() {
  ui.hideWelcomeScreen();

  if (!game) {
    game = createGame({
      canvas: ui.canvas,
      level: levels[levelIndex],
      getCurrentUser: () => CURRENT_USER,
      onLevelComplete
    });
    game.start();
  } else {
    game.setLevel(levels[levelIndex]);
  }
}

async function boot() {
  ui = mountUI(document.querySelector("#app"));

  ui.showBootOverlay("Tap to continue");

  ui.onFirstUserGesture(() => {
    // audio unlock hook preserved
  });

  ui.onLoginGateClick(async () => {
    if (IS_LOGGED_IN) return;

    ui.showBootOverlay("Logging in...");

    const res = await ensurePiLogin({
      onLogin({ user, accessToken }) {
        CURRENT_USER = user;
        CURRENT_ACCESS_TOKEN = accessToken;
        IS_LOGGED_IN = true;
      }
    });

    if (res?.ok) {
      await continueAfterLogin();
    } else {
      ui.showBootOverlay("Login failed. Tap to retry");
    }
  });

  ui.onWelcomeContinue(() => {
    if (!IS_LOGGED_IN) return;
    startGame();
  });

  const env = await enforcePiEnvironment({});
  if (!env.ok) return;

  initPi();
}

function onLevelComplete() {
  ui.showWinPopup();
}

boot();