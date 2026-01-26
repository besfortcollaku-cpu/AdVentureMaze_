// src/main.js

import "./css/ui.css";

import { mountUI } from "./ui/ui.js";
import { createGame } from "./game/game.js";
import { levels } from "./levels/index.js";


function enableBackConfirm() {
  // Push fake history state
  history.pushState({ game: true }, "");

  window.addEventListener("popstate", (e) => {
    // Ask user
    const ok = confirm("Quit game? Your progress in this level will be lost.");

    if (ok) {
      // allow back navigation
      window.removeEventListener("popstate", () => {});
      history.back();
    } else {
      // stay in game
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

  // Start game ONCE
  game.start();
  enableBackConfirm();
}

// Start app
boot();