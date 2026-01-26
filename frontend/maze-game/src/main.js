// src/main.js

import "./css/ui.css";
import { mountUI } from "./ui/ui.js";
import { createGame } from "./game/game.js";
import { levels } from "./levels/index.js";

function boot() {
  const root = document.querySelector("#app");
  if (!root) {
    document.body.innerHTML = "<h1>#app not found</h1>";
    return;
  }

  // Mount UI
  const ui = mountUI(root);
  ui.showWelcome();

  // Create game (DO NOT START)
  const game = createGame({
    canvas: ui.canvas,
    level: levels[0],
    getCurrentUser: () => ({ username: "guest", uid: null }),
    onLevelComplete() {},
  });

  // Start game ONLY after guest click
  ui.onGuestStart(() => {
    ui.hideWelcome();
    game.start();
  });
}

boot();