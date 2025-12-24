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

let levelIndex = 0;
let game = null;

async function boot() {
  // 1) UI first
  const ui = mountUI(document.querySelector("#app"));

  // set initial UI
  if (ui.levelLabel) ui.levelLabel.textContent = levels[levelIndex].name || `LEVEL ${levelIndex + 1}`;

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

  // 4) Game create
  function showCompleteOverlay({ painted, total }) {
    ui.overlayTitle.textContent = "Level Complete! 🎉";
    ui.overlayText.textContent = `You painted all tiles (${painted}/${total}).`;
    ui.overlay.style.display = "block";

    // update Next button label
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

  game = createGame({
    BACKEND,
    canvas: ui.canvas,
    level: levels[levelIndex],
    onLevelComplete: ({ painted, total }) => {
      showCompleteOverlay({ painted, total });
    },
  });

  // Buttons in overlay
  ui.nextLevelBtn.addEventListener("click", () => {
    const nextIdx = levelIndex + 1;
    if (nextIdx >= levels.length) return;

    hideCompleteOverlay();
    levelIndex = nextIdx;

    if (ui.levelLabel) ui.levelLabel.textContent = levels[levelIndex].name || `LEVEL ${levelIndex + 1}`;
    game.setLevel(levels[levelIndex]);
  });

  ui.watchAdBtn.addEventListener("click", () => {
    alert("Ad hook next step ✅ (+10 points)"); // we connect piPay next
  });

  // your bottom buttons (safe)
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