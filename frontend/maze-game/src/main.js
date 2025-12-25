// src/main.js
import "./style.css";

import { mountUI } from "./ui/ui.js";
import { setupPiLogin } from "./pi/piClient.js";
import { enforcePiEnvironment } from "./pi/piDetect.js";
import { createGame } from "./game/game.js";
import { levels } from "./levels/index.js";

const BACKEND = "https://adventuremaze.onrender.com";

let CURRENT_USER = { username: "guest", uid: null };
let CURRENT_ACCESS_TOKEN = null;

// simple points (local only for now)
let points = Number(localStorage.getItem("points") || "0");

// current level index
let levelIndex = 0;

// keep single game instance
let game = null;

async function boot() {
  // 1) UI first
  const ui = mountUI(document.querySelector("#app"));

  // initial HUD
  ui.setPoints(points);
  ui.setLevelName(levels[levelIndex]?.name || `LEVEL ${levelIndex + 1}`);

  // 2) Enforce Pi env (WAIT for Pi injection)
  const env = await enforcePiEnvironment({
    desktopBlockEl: document.getElementById("desktopBlock"),
  });

  if (!env.ok) {
    console.log("Blocked:", env.reason);
    return;
  }

  // 3) Pi login
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

  // 4) Overlay button handlers
  ui.onNextLevel(() => {
    ui.hideLevelComplete();

    levelIndex = Math.min(levelIndex + 1, levels.length - 1);

    const next = levels[levelIndex];
    ui.setLevelName(next?.name || `LEVEL ${levelIndex + 1}`);

    if (game && typeof game.setLevel === "function") {
      game.setLevel(next);
    }
  });

  ui.onWatchAd(() => {
    points += 10;
    localStorage.setItem("points", String(points));
    ui.setPoints(points);
  });

  // 5) Create game
  const firstLevel = levels[levelIndex];

  game = createGame({
    BACKEND,
    canvas: ui.canvas,
    getCurrentUser: () => CURRENT_USER,
    level: firstLevel,

    onLevelComplete: ({ level }) => {
      // +1 point per completed level
      points += 1;
      localStorage.setItem("points", String(points));
      ui.setPoints(points);

      ui.showLevelComplete({
        levelName: level?.name || `LEVEL ${levelIndex + 1}`,
        pointsEarned: 1,
        totalPoints: points,
      });
    },
  });

  game.start();
}

boot();