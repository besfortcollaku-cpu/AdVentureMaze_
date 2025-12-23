// src/main.js

import "./style.css";



import { mountUI } from "./ui/ui.js";

import { setupPiLogin } from "./pi/piClient.js";

import { enforcePiEnvironment } from "./pi/piDetect.js";

import { createGame } from "./game/game.js";

import { level242 } from "./levels/level242.js";



const BACKEND = "https://adventuremaze.onrender.com";



let CURRENT_USER = { username: "guest", uid: null };

let CURRENT_ACCESS_TOKEN = null;



async function boot() {

  // 1) UI first (creates canvas + desktopBlock)

  const ui = mountUI(document.querySelector("#app"));



  // 2) Enforce Pi env (WAIT if your enforcePiEnvironment is async)

  const env = await enforcePiEnvironment({

    desktopBlockEl: ui.desktopBlock, // ✅ use the ref returned by mountUI

  });



  if (!env.ok) {

    console.log("Blocked:", env.reason);

    return; // stop here (don’t init login/game)

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



  // 4) Game

  const game = createGame({

    BACKEND,

    canvas: ui.canvas,

    getCurrentUser: () => CURRENT_USER,

    level: level242,

  });



  game.start();

}



boot();