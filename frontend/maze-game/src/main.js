import "./style.css";

import { mountUI } from "./ui.js";

import { setupPiLogin } from "./pi/piClient.js";



import { level242 } from "./levels/level242.js";
export function createGame() {

  // Game is already running in main.js, so this is just a placeholder.

  console.log("createGame placeholder");

}


/**

 * ✅ SET THIS to your Render backend base URL (must be HTTPS)

 */

const BACKEND = "https://adventuremaze.onrender.com/";



// user state stays in main (so Pi module + game can share)

let CURRENT_USER = { username: "guest", uid: null };

let CURRENT_ACCESS_TOKEN = null;



// Build UI

const ui = mountUI(document.querySelector("#app"));



// Setup Pi login (updates user state + UI)

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



// Create + start game (uses getter so it always sees latest CURRENT_USER)

const game = createGame({

  BACKEND,

  canvas: ui.canvas,

  getCurrentUser: () => CURRENT_USER,

  level: level242,

});



game.start();