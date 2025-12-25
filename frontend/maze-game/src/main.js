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

let points = Number(localStorage.getItem("points") || "0");
let levelIndex = Number(localStorage.getItem("levelIndex") || "0");
levelIndex = Math.max(0, Math.min(levelIndex, levels.length - 1));

let game = null;

async function boot() {
  const ui = mountUI(document.querySelector("#app"));

  // if your UI has these helpers, keep them. If not, remove these two lines.
  ui.setPoints?.(points);
  ui.setLevelName?.(levels[levelIndex]?.name || `LEVEL ${levelIndex + 1}`);

  const env = await enforcePiEnvironment({
    desktopBlockEl: document.getElementById("desktopBlock"),
  });

  if (!env.ok) return;

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

  // Next Level button (no wrap)
  ui.onNextLevel?.(() => {
    ui.hideLevelComplete?.();

    if (levelIndex >= levels.length - 1) {
      // last level – do nothing for now
      return;
    }

    levelIndex += 1;
    localStorage.setItem("levelIndex", String(levelIndex));

    const next = levels[levelIndex];
    ui.setLevelName?.(next?.name || `LEVEL ${levelIndex + 1}`);

    game?.setLevel?.(next);
  });

  // Watch Ad button
  ui.onWatchAd?.(() => {
    points += 10;
    localStorage.setItem("points", String(points));
    ui.setPoints?.(points);
  });

  const firstLevel = levels[levelIndex];

  game = createGame({
    BACKEND,
    canvas: ui.canvas,
    getCurrentUser: () => CURRENT_USER,
    level: firstLevel,

    onLevelComplete: ({ level }) => {
      points += 1;
      localStorage.setItem("points", String(points));
      ui.setPoints?.(points);

      ui.showLevelComplete?.({
        levelName: level?.name || `LEVEL ${levelIndex + 1}`,
        pointsEarned: 1,
        totalPoints: points,
      });
    },
  });

  game.start();
}

boot();