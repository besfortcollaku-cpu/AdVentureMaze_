// src/main.js
import "./style.css";

import { mountUI } from "./ui/ui.js";
import { setupPiLogin } from "./pi/piClient.js";
import { enforcePiEnvironment } from "./pi/piDetect.js";
import { createGame } from "./game/game.js";
import { levels } from "./levels/index.js";

const BACKEND = "https://adventuremaze.onrender.com";

// user state
let CURRENT_USER = { username: "guest", uid: null };
let CURRENT_ACCESS_TOKEN = null;

let levelIndex = 0;
let game = null;

// points
let POINTS = 0;
let awardedThisLevel = false;

function pointsKey(username) {
  return `maze_points:${username || "guest"}`;
}

function loadPoints(username) {
  const raw = localStorage.getItem(pointsKey(username));
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

function savePoints(username, value) {
  localStorage.setItem(pointsKey(username), String(value));
}

function setPoints(ui, n) {
  POINTS = n;
  if (ui?.coinCount) ui.coinCount.textContent = String(POINTS);
  savePoints(CURRENT_USER?.username || "guest", POINTS);
}

function addPoints(ui, delta) {
  setPoints(ui, POINTS + delta);
}

async function boot() {
  // 1) UI first
  const ui = mountUI(document.querySelector("#app"));

  // initial label
  if (ui.levelLabel) ui.levelLabel.textContent = levels[levelIndex].name || `LEVEL ${levelIndex + 1}`;

  // load points for guest at start
  setPoints(ui, loadPoints("guest"));

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

      // switch points bucket to user
      const username = CURRENT_USER?.username || "guest";
      setPoints(ui, loadPoints(username));
    },
  });

  // Overlay helpers
  function showCompleteOverlay({ painted, total }) {
    ui.overlayTitle.textContent = "Level Complete! 🎉";
    ui.overlayText.textContent = `You painted all tiles (${painted}/${total}).`;
    ui.overlay.style.display = "block";

    const nextIdx = levelIndex + 1;
    if (nextIdx < levels.length) {
      ui.nextLevelBtn.textContent = `Next Level (${nextIdx + 1})`;
      ui.nextLevelBtn.disabled = false;
    } else {
      ui.nextLevelBtn.textContent = "More levels soon";
      ui.nextLevelBtn.disabled = true;
    }
  }

  function hideCompleteOverlay() {
    ui.overlay.style.display = "none";
  }

  // 4) Game create
  game = createGame({
    BACKEND,
    canvas: ui.canvas,
    level: levels[levelIndex],
    onLevelComplete: ({ painted, total }) => {
      // ✅ +1 point only once per level
      if (!awardedThisLevel) {
        awardedThisLevel = true;
        addPoints(ui, 1);
      }
      showCompleteOverlay({ painted, total });
    },
  });

  // Overlay buttons
  ui.nextLevelBtn.addEventListener("click", () => {
    const nextIdx = levelIndex + 1;
    if (nextIdx >= levels.length) return;

    hideCompleteOverlay();

    levelIndex = nextIdx;
    awardedThisLevel = false; // reset award for next level

    if (ui.levelLabel) ui.levelLabel.textContent = levels[levelIndex].name || `LEVEL ${levelIndex + 1}`;
    game.setLevel(levels[levelIndex]);
  });

  ui.watchAdBtn.addEventListener("click", () => {
    // ✅ temporary reward (Pi payment/ad hook comes next step)
    addPoints(ui, 10);
    alert("+10 points ✅ (ad hook next step)");
  });

  // Bottom/top buttons (safe)
  document.getElementById("hintBtn")?.addEventListener("click", () => alert("Hint later 😉"));
  document.getElementById("x3Btn")?.addEventListener("click", () => alert("Boost later 😉"));
  document.getElementById("settings")?.addEventListener("click", () => alert("Settings later"));
  document.getElementById("controls")?.addEventListener("click", () => alert("Swipe to move"));
  document.getElementById("paint")?.addEventListener("click", () => alert("Paint shop later"));
  document.getElementById("trophy")?.addEventListener("click", () => alert("Trophies later"));
  document.getElementById("noads")?.addEventListener("click", () => alert("Remove ads later"));

  game.start();
}

boot();