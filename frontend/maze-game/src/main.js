import "./style.css";
import "./css/ui.css";

import { mountUI } from "./ui/ui.js";
import { mountLevelsUI } from "./ui/uiLevels.js";
import { createHintPopup } from "./ui/uiHints.js";
import { createSkipPopup } from "./ui/uiSkip.js";
import { createGame } from "./game/game.js";
import { levels } from "./levels/index.js";

const BACKEND = "https://triumphant-gentleness-production.up.railway.app";
const FREE_HINTS = 3;
const FREE_SKIPS = 3;

let CURRENT_USER = null;
let CURRENT_ACCESS_TOKEN = null;
let levelIndex = 0;

function freeHintsLeft() {
  return Math.max(0, FREE_HINTS - (CURRENT_USER?.free_hints_used || 0));
}

function freeSkipsLeft() {
  return Math.max(0, FREE_SKIPS - (CURRENT_USER?.free_skips_used || 0));
}

async function post(path, body) {
  const res = await fetch(`${BACKEND}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(CURRENT_ACCESS_TOKEN
        ? { Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}` }
        : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("API error");
  return res.json();
}

function boot() {
  const root = document.body;
  const ui = mountUI(root);
  mountLevelsUI(root);

  const hintPopup = createHintPopup();
  const skipPopup = createSkipPopup();

  ui.hintBtn.onclick = () => {
    hintPopup.show({ freeLeft: freeHintsLeft() });
  };

  ui.skipBtn.onclick = () => {
    skipPopup.show({ freeLeft: freeSkipsLeft() });
  };

  hintPopup.onFreeHint(async () => {
    await post("/api/hint", { mode: "free" });
    CURRENT_USER.free_hints_used++;
    hintPopup.hide();
  });

  hintPopup.onBuyHint(async () => {
    await post("/api/hint", { mode: "coins" });
    hintPopup.hide();
  });

  hintPopup.onWatchAdHint(async () => {
    await post("/api/hint", { mode: "ad" });
    hintPopup.hide();
  });

  skipPopup.onFreeSkip(async () => {
    await post("/api/skip", { mode: "free" });
    CURRENT_USER.free_skips_used++;
    skipPopup.hide();
    gameNextLevel();
  });

  skipPopup.onBuySkip(async () => {
    await post("/api/skip", { mode: "coins" });
    skipPopup.hide();
    gameNextLevel();
  });

  skipPopup.onWatchAdSkip(async () => {
    await post("/api/skip", { mode: "ad" });
    skipPopup.hide();
    gameNextLevel();
  });

  const game = createGame({
    canvas: ui.canvas,
    level: levels[0],
    onLevelComplete() {
      ui.setLevel(++levelIndex);
    },
  });

  function gameNextLevel() {
    levelIndex = Math.min(levels.length - 1, levelIndex + 1);
    game.setLevel(levels[levelIndex]);
    ui.setLevel(levelIndex + 1);
  }

  ui.onGuestStart(() => {
    CURRENT_USER = {
      username: "Guest",
      free_hints_used: 0,
      free_skips_used: 0,
    };
    ui.hideWelcome();
    game.start();
  });

  ui.showWelcome();
}

window.addEventListener("DOMContentLoaded", boot);