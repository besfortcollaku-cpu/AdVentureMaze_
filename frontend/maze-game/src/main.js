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

// points (local)
const POINTS_KEY = "points";
let points = Number(localStorage.getItem(POINTS_KEY) || "0");

// level index (local)
const LEVEL_KEY = "levelIndex";
function clampIndex(i) {
  const n = Array.isArray(levels) ? levels.length : 0;
  if (!n) return 0;
  return Math.max(0, Math.min(n - 1, i));
}
let levelIndex = clampIndex(Number(localStorage.getItem(LEVEL_KEY) || "0"));

let game = null;

async function boot() {
  const ui = mountUI(document.querySelector("#app"));

  // settings toggles
  const s0 = getSettings();
  ui.setSoundEnabled?.(s0.sound);
  ui.setVibrationEnabled?.(s0.vibration);

  ui.onSoundToggle?.((v) => setSetting("sound", v));
  ui.onVibrationToggle?.((v) => setSetting("vibration", v));

  subscribeSettings((s) => {
    ui.setSoundEnabled?.(s.sound);
    ui.setVibrationEnabled?.(s.vibration);
  });

  // if you have points HUD methods (optional)
  ui.setPoints?.(points);

  // Pi env
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

  function setLevelNameOnUI() {
    const lvl = levels[levelIndex];
    ui.setLevelName?.(lvl?.name || `LEVEL ${levelIndex + 1}`);
  }
  setLevelNameOnUI();

  function goNextLevel() {
    // advance until last level (no looping)
    if (levelIndex < levels.length - 1) {
      levelIndex += 1;
      levelIndex = clampIndex(levelIndex);
      localStorage.setItem(LEVEL_KEY, String(levelIndex));

      const next = levels[levelIndex];
      setLevelNameOnUI();

      // ✅ switch without reload
      game?.setLevel?.(next);
    } else {
      // last level finished
      // (optional) you can show a “coming soon” overlay
      if (typeof ui.showAllComplete === "function") ui.showAllComplete();
    }
  }

  // If your UI has Next button / overlay
  ui.onNextLevel?.(() => {
    ui.hideLevelComplete?.();
    goNextLevel();
  });

  // Watch ad button (+10)
  ui.onWatchAd?.(() => {
    points += 10;
    localStorage.setItem(POINTS_KEY, String(points));
    ui.setPoints?.(points);
  });

  const firstLevel = levels[levelIndex];

  game = createGame({
    BACKEND,
    canvas: ui.canvas,
    getCurrentUser: () => CURRENT_USER,
    level: firstLevel,

    onLevelComplete: ({ level }) => {
      // +1 point per completed level
      points += 1;
      localStorage.setItem(POINTS_KEY, String(points));
      ui.setPoints?.(points);

      // show overlay if you have it, else fallback confirm
      if (typeof ui.showLevelComplete === "function") {
        ui.showLevelComplete({
          levelName: level?.name || `LEVEL ${levelIndex + 1}`,
          pointsEarned: 1,
          totalPoints: points,
          nextLevelName:
            levelIndex < levels.length - 1
              ? levels[levelIndex + 1]?.name || `LEVEL ${levelIndex + 2}`
              : "Coming soon",
        });
      } else {
        const ok = window.confirm("Level complete! Go Next Level?");
        if (ok) goNextLevel();
      }
    },
  });

  game.start();
}

boot();