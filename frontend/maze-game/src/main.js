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

// points
let points = Number(localStorage.getItem("points") || "0");

// current level index
let levelIndex = Number(localStorage.getItem("levelIndex") || "0");

// ✅ max unlocked level index (0 means only level 1 is unlocked)
let unlockedMaxIndex = Number(localStorage.getItem("unlockedMaxIndex") || "0");

let game = null;

function clampLevelIndex() {
  if (!Number.isFinite(levelIndex)) levelIndex = 0;
  levelIndex = Math.max(0, Math.min(levelIndex, levels.length - 1));
}

function saveProgress() {
  localStorage.setItem("points", String(points));
  localStorage.setItem("levelIndex", String(levelIndex));
  localStorage.setItem("unlockedMaxIndex", String(unlockedMaxIndex));
}

function isLevelUnlocked(idx) {
  return idx <= unlockedMaxIndex;
}

function levelCost(idx) {
  const c = levels[idx]?.unlockCost;
  return typeof c === "number" && c > 0 ? c : 0;
}

async function boot() {
  clampLevelIndex();

  // 1) UI
  const ui = mountUI(document.querySelector("#app"));

  ui.setPoints(points);
  ui.setLevelName(levels[levelIndex]?.name || `LEVEL ${levelIndex + 1}`);

  // 2) Enforce Pi env
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

  // ✅ Unlock overlay handlers
  ui.onUnlockLevel(() => {
    const idx = ui._pendingUnlockIndex;
    if (!Number.isFinite(idx)) return;

    const cost = levelCost(idx);
    if (points < cost) return;

    points -= cost;
    unlockedMaxIndex = Math.max(unlockedMaxIndex, idx);

    // go to that level immediately
    levelIndex = idx;

    saveProgress();

    ui.setPoints(points);
    ui.hideUnlock();
    ui.setLevelName(levels[levelIndex]?.name || `LEVEL ${levelIndex + 1}`);

    if (game && typeof game.setLevel === "function") {
      game.setLevel(levels[levelIndex]);
    }
  });

  ui.onCancelUnlock(() => {
    ui.hideUnlock();
  });

  // 4) Level complete overlay buttons
  ui.onNextLevel(() => {
    ui.hideLevelComplete();

    const nextIndex = Math.min(levelIndex + 1, levels.length - 1);

    // If you are already at last level, do nothing
    if (nextIndex === levelIndex) return;

    // ✅ If next level locked => show unlock overlay
    const cost = levelCost(nextIndex);
    const locked = cost > 0 && !isLevelUnlocked(nextIndex);

    if (locked) {
      ui.showUnlock({
        levelName: levels[nextIndex]?.name || `LEVEL ${nextIndex + 1}`,
        cost,
        points,
        index: nextIndex,
      });
      return;
    }

    // otherwise load next
    levelIndex = nextIndex;
    saveProgress();

    const next = levels[levelIndex];
    ui.setLevelName(next?.name || `LEVEL ${levelIndex + 1}`);

    if (game && typeof game.setLevel === "function") {
      game.setLevel(next);
    }
  });

  ui.onWatchAd(() => {
    points += 10;
    saveProgress();
    ui.setPoints(points);
  });

  // 5) Create game
  const firstLevel = levels[levelIndex];

  game = createGame({
    BACKEND,
    canvas: ui.canvas,
    getCurrentUser: () => CURRENT_USER,
    level: firstLevel,

    onLevelComplete: ({ level, painted, total }) => {
      // +1 point per completed level
      points += 1;

      // ✅ unlock the next level automatically (but user still presses Next)
      unlockedMaxIndex = Math.max(unlockedMaxIndex, levelIndex + 1);

      saveProgress();
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