// src/ui/uiLevels.js
import "../css/levels.css";

let rootEl = null;
let onSelectLevel = null;

export function mountLevelsUI({ onSelect }) {
  onSelectLevel = onSelect;
  rootEl = document.getElementById("levelsOverlay");

  if (!rootEl) {
    console.warn("Levels UI not found in DOM");
    return null;
  }

  window.__levelsUI = {
    open,
    close,
    render,
  };

  return window.__levelsUI;
}

function open() {
  if (!rootEl) return;
  rootEl.classList.remove("hidden");
  render();
}

function close() {
  if (!rootEl) return;
  rootEl.classList.add("hidden");
}

function render() {
  if (!window.__progress) {
    console.warn("Progress not loaded yet");
    return;
  }

  const unlocked = window.__progress.level; // 🔥 THIS is the key
  const total = window.__levels?.length || 20;

  const grid = rootEl.querySelector(".levelsGrid");
  grid.innerHTML = "";

  for (let i = 1; i <= total; i++) {
    const tile = document.createElement("button");
    tile.className = "levelTile";

    if (i < unlocked) {
      tile.classList.add("done");
      tile.innerHTML = "✓";
    } else if (i === unlocked) {
      tile.classList.add("current");
      tile.textContent = i;
      tile.onclick = () => onSelectLevel(i - 1);
    } else {
      tile.classList.add("locked");
      tile.innerHTML = "🔒";
      tile.disabled = true;
    }

    grid.appendChild(tile);
  }
}