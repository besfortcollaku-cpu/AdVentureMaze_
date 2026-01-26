// src/main.js

import "./css/ui.css";

import { mountUI } from "./ui/ui.js";
import { createGame } from "./game/game.js";
import { levels } from "./levels/index.js";


function enableBackConfirm(ui) {
  history.pushState({ game: true }, "");

  window.addEventListener("popstate", async () => {
    const ok = await ui.showConfirmQuit();

    if (ok) {
      window.removeEventListener("popstate", () => {});
      history.back();
    } else {
      history.pushState({ game: true }, "");
    }
  });
}
// ---------------------------
// BOOT
// ---------------------------
function boot() {
  const root = document.querySelector("#app");
  if (!root) {
    document.body.innerHTML = "<h1>#app not found</h1>";
    return;
  }

  // Mount UI
  const ui = mountUI(root);
  

  // Create game (LEVEL 1 ONLY)
  const game = createGame({
    canvas: ui.canvas,
    level: levels[0],
    getCurrentUser: () => ({ username: "guest", uid: null }),
    onLevelComplete() {},
  });
  ui.onGuestStart(() => {
  ui.hideWelcome();
  game.start();
});
game.start();

  
  
}

// Start app
boot();