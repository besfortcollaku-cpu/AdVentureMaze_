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



function getLevelIndex() {

  const p = new URLSearchParams(window.location.search);

  const lvl = parseInt(p.get("level") || "1", 10);

  return Math.max(0, Math.min(levels.length - 1, lvl - 1));

}



function setLevelIndex(i) {

  const p = new URLSearchParams(window.location.search);

  p.set("level", String(i + 1));

  const nextUrl = window.location.pathname + "?" + p.toString();

  window.location.href = nextUrl;

}



function getPoints() {

  return parseInt(localStorage.getItem("points") || "0", 10);

}

function setPoints(n) {

  localStorage.setItem("points", String(n));

}



async function boot() {

  const ui = mountUI(document.querySelector("#app"));



  // show points

  ui.coinCount.textContent = String(getPoints());



  // set level title

  const levelIndex = getLevelIndex();

  const level = levels[levelIndex];

  ui.levelTitle.textContent = level.name || `LEVEL ${levelIndex + 1}`;



  // Enforce Pi env (WAIT for Pi injection)

  const env = await enforcePiEnvironment({

    desktopBlockEl: ui.desktopBlock,

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



  // Game

  const game = createGame({

    canvas: ui.canvas,

    level,

    onLevelComplete: () => {

      // +1 point each level complete

      const p = getPoints() + 1;

      setPoints(p);

      ui.coinCount.textContent = String(p);



      // show overlay

      ui.completeOverlay.style.display = "flex";

    },

  });



  // overlay buttons

  ui.nextLevelBtn.addEventListener("click", () => {

    const next = Math.min(levels.length - 1, levelIndex + 1);

    setLevelIndex(next);

  });



  ui.watchAdBtn.addEventListener("click", () => {

    // hook later; for now just add +10

    const p = getPoints() + 10;

    setPoints(p);

    ui.coinCount.textContent = String(p);

    alert("Ad hook later ✅ (+10 added for now)");

  });



  game.start();

}



boot();