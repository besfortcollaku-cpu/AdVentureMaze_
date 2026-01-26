// src/main.js
import "./style.css";

import { mountUI } from "./ui/ui.js";
import { createGame } from "./game/game.js";
import { levels } from "./levels/index.js";

import { ensureAudioUnlocked } from "./game/rollSound.js";

const BACKEND = "https://adventuremaze.onrender.com";

let CURRENT_USER = { username: "guest", uid: null };
let levelIndex = 0;

async function boot() {
  const root = document.querySelector("#app");
  if (!root) {
    document.body.innerHTML = "<h1>#app not found</h1>";
    return;
  }

  const ui = mountUI(root);

  // Audio unlock (prevents silent WebAudio on mobile)
  ui.onFirstUserGesture(() => ensureAudioUnlocked());

  // Create game ONCE
  const game = createGame({
    BACKEND,
    canvas: ui.canvas,
    getCurrentUser: () => CURRENT_USER,
    level: levels[levelIndex],
    onLevelComplete() {
      // keep empty for now
    },
  });

  // Wire buttons (safe even if not implemented in engine)
  ui.onHint(() => {
    if (typeof game.hint === "function") game.hint();
  });

  ui.onSkip(() => {
    if (typeof game.skip === "function") game.skip();
  });

  ui.setLevel(levelIndex + 1);

  // Start rendering
  game.start();
}

boot();