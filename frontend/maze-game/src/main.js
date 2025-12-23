// src/main.js

import "./style.css";



import { mountUI } from "./ui/ui.js";

import { setupPiLogin } from "./pi/piClient.js";

import { enforcePiEnvironment } from "./pi/piDetect.js";

import { createGame } from "./game/game.js";

import { level242 as level1 } from "./levels/level242.js"; // keep file name for now



const BACKEND = "https://adventuremaze.onrender.com";



let CURRENT_USER = { username: "guest", uid: null };

let CURRENT_ACCESS_TOKEN = null;



let POINTS = 0;



async function boot() {

  // 1) UI first

  const ui = mountUI(document.querySelector("#app"));



  // show Level 1 label

  if (ui.levelTitle) ui.levelTitle.textContent = "LEVEL 1";

  if (ui.coinCount) ui.coinCount.textContent = String(POINTS);



  // 2) Enforce Pi env

  const env = await enforcePiEnvironment({

    desktopBlockEl: ui.desktopBlock,

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



  // ✅ popup button actions

  ui.nextLevelBtn.addEventListener("click", () => {

    // later: load next level data

    ui.hideLevelComplete();

    alert("Next level (Level 2) coming next step ✅");

  });



  ui.watchAdBtn.addEventListener("click", () => {

    // later: real ad hook + reward via backend

    POINTS += 10;

    ui.coinCount.textContent = String(POINTS);

    ui.hideLevelComplete();

    alert("Ad reward simulated: +10 points ✅");

  });



  // 4) Game

  const game = createGame({

    canvas: ui.canvas,

    level: { ...level1, number: 1 },

    onComplete: ({ levelNumber, pointsEarned }) => {

      // base reward per level

      POINTS += pointsEarned;

      ui.coinCount.textContent = String(POINTS);



      ui.showLevelComplete({ levelNumber, pointsEarned });

    },

  });



  game.start();

}



boot();