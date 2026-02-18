
// uiLevels.js
import "../css/levels.css";
// src/ui/uiLevels.js

import { levels } from "../levels/index.js";

const overlay = document.getElementById("levelsOverlay");
const grid = document.getElementById("levelsGrid");
const closeBtn = document.getElementById("levelsClose");

async function getProgress() {
  const res = await fetch("/progress", {
    credentials: "include"
  });

  const json = await res.json();
  if (!json.ok) throw new Error("Failed to load progress");

  return json.data; // { uid, level, coins }
}

function renderLevels(maxUnlocked) {
  grid.innerHTML = "";

  LEVELS.forEach((_, index) => {
    const levelNumber = index + 1;
    const tile = document.createElement("button");
    tile.className = "level-tile";

    // ✅ Completed
    if (levelNumber < maxUnlocked) {
      tile.classList.add("completed");
      tile.innerHTML = "✓";
    }
    // ▶ Current unlocked
    else if (levelNumber === maxUnlocked) {
      tile.classList.add("unlocked");
      tile.textContent = levelNumber;
      tile.onclick = () => startLevel(levelNumber);
    }
    // 🔒 Locked
    else {
      tile.classList.add("locked");
      tile.innerHTML = "🔒";
      tile.disabled = true;
    }

    grid.appendChild(tile);
  });
}

export async function openLevels() {
  overlay.classList.remove("hidden");

  try {
    const progress = await getProgress();
    const maxUnlocked = Math.max(1, Number(progress.level || 1));
    renderLevels(maxUnlocked);
  } catch (e) {
    console.error("Levels load failed:", e);
  }
}

export function closeLevels() {
  overlay.classList.add("hidden");
}

/**
 * ✅ REQUIRED by main.js and ui.js
 * Mounts listeners ONCE
 */
export function mountLevelsUI() {
  if (!overlay || !grid) {
    console.warn("Levels UI not found in DOM");
    return;
  }

  closeBtn?.addEventListener("click", closeLevels);
}