// src/main.js
import "./style.css";

import { mountUI } from "./ui/ui.js";
import { setupPiLogin } from "./pi/piClient.js";
import { enforcePiEnvironment } from "./pi/piDetect.js";
import { createGame } from "./game/game.js";

import { level242 } from "./levels/level242.js"; // ✅ LEVEL 1 (name inside is LEVEL 1)
import { level2 } from "./levels/level2.js";     // ✅ LEVEL 2
import { level3 } from "./levels/level3.js";     // ✅ LEVEL 3
import { level4 } from "./levels/level4.js";     // ✅ LEVEL 4
import { level5 } from "./levels/level5.js";     // ✅ LEVEL 5
const BACKEND = "https://adventuremaze.onrender.com";

// user state
let CURRENT_USER = { username: "guest", uid: null };
let CURRENT_ACCESS_TOKEN = null;

// points (local for now)
function getPoints() {
  const n = parseInt(localStorage.getItem("points") || "0", 10);
  return Number.isFinite(n) ? n : 0;
}
function setPoints(n) {
  localStorage.setItem("points", String(n));
}

// choose level by URL param (?level=1,2,3...) default 1
function getLevelIndex() {
  const params = new URLSearchParams(window.location.search);
  const n = parseInt(params.get("level") || "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}
function setLevelIndex(n) {
  const url = new URL(window.location.href);
  url.searchParams.set("level", String(n));
  window.location.href = url.toString(); // simplest reliable "restart"
}

const LEVELS = [level242, level2];

async function boot() {
  const ui = mountUI(document.querySelector("#app"));

  // set header points + level title
  ui.coinCount.textContent = String(getPoints());

  const levelIndex = getLevelIndex();
  const level = LEVELS[levelIndex - 1] || LEVELS[0];

  ui.levelText.textContent = level?.name || `LEVEL ${levelIndex}`;

  // Enforce Pi env (WAIT for Pi injection)
  const env = await enforcePiEnvironment({
    desktopBlockEl: document.getElementById("desktopBlock"),
  });

  if (!env.ok) {
    console.log("Blocked:", env.reason);
    return;
  }

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

  // Level complete UI
  function showLevelComplete() {
    // +1 point per level finish
    const newPoints = getPoints() + 1;
    setPoints(newPoints);
    ui.coinCount.textContent = String(newPoints);

    ui.levelOverlayTitle.textContent = `${level?.name || "LEVEL"} COMPLETE!`;
    ui.levelOverlayText.textContent = `+1 point (Total: ${newPoints})`;
    ui.levelOverlay.style.display = "flex";
  }

  ui.nextLevelBtn.onclick = () => {
    ui.levelOverlay.style.display = "none";
    setLevelIndex(levelIndex + 1);
  };

  ui.watchAdBtn.onclick = () => {
    // placeholder: later we hook real Pi ads/payment
    const newPoints = getPoints() + 10;
    setPoints(newPoints);
    ui.coinCount.textContent = String(newPoints);
    ui.levelOverlayText.textContent = `+10 points (Total: ${newPoints})`;
    alert("Ad system later ✅ (you still got +10 for now)");
  };

  // Game
  const game = createGame({
    canvas: ui.canvas,
    level,
    onLevelComplete: showLevelComplete,
  });

  game.start();
}

boot();