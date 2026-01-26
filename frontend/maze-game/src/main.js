// src/main.js

import "./css/ui.css";
import { mountUI } from "./ui/ui.js";
import { createGame } from "./game/game.js";
import { initPi } from "./pi/piInit.js";
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
  initPi();
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
    const auth = await window.Pi.authenticate(
      ["username"],
      () => {}
    );

    console.log("PI AUTH OK", auth);

    // 🔥 ADD THIS BLOCK (BACKEND HANDSHAKE)
    await fetch("/api/login/pi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: auth.user.uid,
        username: auth.user.username,
        accessToken: auth.accessToken
      })
    });

    // ✅ ONLY AFTER BACKEND CONFIRM
    ui.hideWelcome();
    document.body.classList.add("game-running");
    game.start();

  } catch (err) {
    console.error("PI LOGIN FAILED", err);
  }
});
}

boot();