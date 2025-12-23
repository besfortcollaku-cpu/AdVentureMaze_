import "./style.css";



import { mountUI } from "./ui/ui.js";

import { setupPiLogin } from "./pi/piClient.js";

import { enforcePiEnvironment } from "./pi/piDetect.js";

import { createGame } from "./game/game.js";

import { level242 } from "./levels/level242.js";



/**

 * Render backend base URL (NO trailing slash)

 */

const BACKEND = "https://adventuremaze.onrender.com";



// user state

let CURRENT_USER = { username: "guest", uid: null };

let CURRENT_ACCESS_TOKEN = null;



/* --------------------------------------------------

   1) BUILD UI (creates canvas + desktopBlock)

-------------------------------------------------- */

const ui = mountUI(document.querySelector("#app"));



/* --------------------------------------------------

   2) PI BROWSER ENFORCEMENT  👈 INSERTED HERE

-------------------------------------------------- */

const env = enforcePiEnvironment({

  desktopBlockEl: document.getElementById("desktopBlock"),

});



if (!env.ok) throw new Error ("Not running in Pi Browser: ");



/* --------------------------------------------------

   3) SETUP PI LOGIN

-------------------------------------------------- */

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



/* --------------------------------------------------

   4) CREATE + START GAME

-------------------------------------------------- */

const game = createGame({

  BACKEND,

  canvas: ui.canvas,

  getCurrentUser: () => CURRENT_USER,

  level: level242,

});



game.start();