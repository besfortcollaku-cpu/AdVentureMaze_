import "../css/levels.css";

let rootEl = null;
let gridEl = null;
let onSelectLevel = null;

export function mountLevelsUI({ onSelect }) {
  onSelectLevel = onSelect;

  rootEl = document.getElementById("levelsOverlay");
  if (!rootEl) {
    console.warn("[LevelsUI] #levelsOverlay not found");
    return null;
  }

  gridEl = rootEl.querySelector("#levelsGrid");
  const closeBtn = rootEl.querySelector("#levelsCloseBtn");

  closeBtn.onclick = () => close();

  render();

  return {
    open,
    close,
    refresh: render,
  };
}

function open() {
  rootEl.classList.remove("hidden");
}

function close() {
  rootEl.classList.add("hidden");
}

function render() {
  if (!gridEl) return;

  const progress = window.__progress || { level: 1 };
  const maxUnlocked = progress.level || 1;

  gridEl.innerHTML = "";

  const totalLevels = window.__levels?.length || 20;

  for (let i = 1; i <= totalLevels; i++) {
    const btn = document.createElement("button");
    btn.className = "levelTile";

    if (i < maxUnlocked) {
      btn.classList.add("completed");
      btn.innerHTML = "✓";
    } else if (i === maxUnlocked) {
      btn.classList.add("current");
      btn.textContent = i;
    } else {
      btn.classList.add("locked");
      btn.innerHTML = "🔒";
      btn.disabled = true;
    }

    if (i <= maxUnlocked) {
      btn.onclick = () => {
        close();
        onSelectLevel?.(i);
      };
    }

    gridEl.appendChild(btn);
  }
}