// uiLevels.js

import { LEVELS } from "../levels/index.js";

const overlay = document.getElementById("levelsOverlay");
const grid = document.getElementById("levelsGrid");

async function getProgress() {
  const res = await fetch("/progress", {
    credentials: "include" // IMPORTANT for Pi auth
  });

  const json = await res.json();
  if (!json.ok) throw new Error("Failed to load progress");

  return json.data; // { uid, level, coins }
}

function renderLevels(maxUnlocked) {
  grid.innerHTML = "";

  LEVELS.forEach((lvl, index) => {
    const levelNumber = index + 1;

    const tile = document.createElement("button");
    tile.className = "level-tile";

    // ✅ COMPLETED
    if (levelNumber < maxUnlocked) {
      tile.classList.add("completed");
      tile.innerHTML = "✓";
    }

    // ✅ UNLOCKED (CURRENT)
    else if (levelNumber === maxUnlocked) {
      tile.classList.add("unlocked");
      tile.textContent = levelNumber;
      tile.onclick = () => startLevel(levelNumber);
    }

    // 🔒 LOCKED
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

    // 🔥 THIS IS THE KEY LINE
    const maxUnlocked = Math.max(1, Number(progress.level || 1));

    renderLevels(maxUnlocked);
  } catch (e) {
    console.error("Levels load failed:", e);
  }
}

export function closeLevels() {
  overlay.classList.add("hidden");
}