// src/main.js

import "./css/ui.css";
import { mountUI } from "./ui/ui.js";
import { createGame } from "./game/game.js";
import { ensurePiLogin } from "./pi/piClient.js";
import { levels } from "./levels/index.js";

function boot() {
  const root = document.querySelector("#app");
  if (!root) {
    document.body.innerHTML = "<h1>#app not found</h1>";
    return;
  }

  // Mount UI
  const ui = mountUI(root);
  // iOS hard lock
document.body.style.position = "fixed";
document.body.style.width = "100%";
document.body.style.height = "100%";
  document.addEventListener(
  "touchmove",
  (e) => e.preventDefault(),
  { passive: false }
);
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
      document.body.classList.remove("welcome-visible");
      document.body.classList.add("game-running");
    ui.hideWelcome();
    game.start();
  });
  ui.onLoginClick(async () => {
  try {
    const user = await ensurePiLogin();

    document.body.classList.add("game-running");

    CURRENT_USER = user;
    IS_GUEST = false;

    ui.setUser?.(user); // safe if stub
    ui.hideWelcome();

    game.start();
  } catch (e) {
    alert("Pi login failed");
  }
});
}

boot();