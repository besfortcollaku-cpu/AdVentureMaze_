// src/main.js

import "./style.css";



import { mountUI } from "./ui/ui.js";

import { setupPiLogin } from "./pi/piClient.js";

import { enforcePiEnvironment } from "./pi/piDetect.js";

import { createGame } from "./game/game.js";



import { level1, level2 } from "./levels/index.js";



const BACKEND = "https://adventuremaze.onrender.com";



let CURRENT_USER = { username: "guest", uid: null };

let CURRENT_ACCESS_TOKEN = null;



function pickLevelFromURL() {

  const params = new URLSearchParams(window.location.search);

  const lvl = Number(params.get("lvl") || "1");



  if (lvl === 2) return level2;

  return level1; // default

}



async function boot() {

  // 1) UI first

  const ui = mountUI(document.querySelector("#app"));



  // 2) Enforce Pi env (wait for Pi injection if your detect does that)

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



  // 4) Game (Level loader here)

  const level = pickLevelFromURL();



  const game = createGame({

    BACKEND,

    canvas: ui.canvas,

    getCurrentUser: () => CURRENT_USER,

    level,

  });



  game.start();

}



boot();