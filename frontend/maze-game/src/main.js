import "./style.css";



import { mountUI } from "./ui/ui.js";

import { setupPiLogin } from "./pi/piClient.js";

import { enforcePiEnvironment } from "./pi/piDetect.js";

import { createGame } from "./game/game.js";

import { level242 } from "./levels/level242.js";



(async () => {

  const BACKEND = "https://adventuremaze.onrender.com";



  let CURRENT_USER = { username: "guest", uid: null };

  let CURRENT_ACCESS_TOKEN = null;



  const ui = mountUI(document.querySelector("#app"));



  const env = await enforcePiEnvironment({

    desktopBlockEl: document.getElementById("desktopBlock"),

  });



  if (!env.ok) throw new Error("Not running in Pi Browser: " + env.reason);



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



  const game = createGame({

    BACKEND,

    canvas: ui.canvas,

    getCurrentUser: () => CURRENT_USER,

    level: level242,

  });



  game.start();

})();