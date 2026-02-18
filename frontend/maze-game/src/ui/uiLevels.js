
// uiLevels.js
import "../css/levels.css";
// src/ui/uiLevels.js

let rootEl = null;
let onSelectLevel = null;

export function mountLevelsUI({ onSelect }) {
  onSelectLevel = onSelect;
  rootEl = document.getElementById("levelsOverlay");

  if (!rootEl) {
    console.warn("Levels UI not found in DOM");
    return;
  }

  renderLevels();
}

function renderLevels() {
  if (!window.__progress) {
    console.error("Progress not loaded yet");
    return;
  }

  const { level: currentLevel } = window.__progress;

  const TOTAL_LEVELS = getTotalLevels();
  const grid = rootEl.querySelector(".levelsGrid");

  if (!grid) {
    console.error("levelsGrid not found");
    return;
  }

  grid.innerHTML = "";

  for (let i = 1; i <= TOTAL_LEVELS; i++) {
    const tile = document.createElement("button");
    tile.className = "levelTile";

    if (i < currentLevel) {
      tile.classList.add("completed");
      tile.innerHTML = "✓";
    } else if (i === currentLevel) {
      tile.classList.add("current");
      tile.innerHTML = i;
      tile.onclick = () => onSelectLevel(i);
    } else {
      tile.classList.add("locked");
      tile.innerHTML = "🔒";
      tile.disabled = true;
    }

    grid.appendChild(tile);
  }
}

// reads real level count from backend config
function getTotalLevels() {
  // backend-defined levels list
  if (window.__levels && Array.isArray(window.__levels)) {
    return window.__levels.length;
  }

  // fallback safety
  return 20;
}

export function mountLevelsUI() {
  const root = document.getElementById("levelsOverlay");
  if (!root) {
    console.warn("Levels UI not found in DOM");
    return null;
  }

  // create DOM once
  // attach listeners
  // fetch progress
  // render levels

  window.__levelsUI = {
    open,
    close,
    selectLevel
  };

  return window.__levelsUI;
}