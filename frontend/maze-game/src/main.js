import "./style.css";

import { mountUI } from "./ui.js";
import { setupPiLogin } from "./pi/piClient.js";
import { createGame } from "./game.js";
import { level242 } from "./levels/level242.js";

/**
 * ✅ Render backend base URL (NO trailing slash)
 */
const BACKEND = "https://adventuremaze.onrender.com";

// user state stays in main (so Pi module + game can share)
let CURRENT_USER = { username: "guest", uid: null };
let CURRENT_ACCESS_TOKEN = null;

// Build UI (this creates the canvas)
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

const canvas = document.getElementById("game");


// Create + start game
const game = createGame({
  BACKEND,
  canvas: ui.canvas,
  getCurrentUser: () => CURRENT_USER,
  level: level242,
});

game.start();