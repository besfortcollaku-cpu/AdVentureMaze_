import "../css/levels.css";

let rootEl = null;
let gridEl = null;
let onSelectLevel = null;
let totalLevels = 0;

export function mountLevelsUI({ onSelect, levelsCount }) {
  onSelectLevel = onSelect;
  totalLevels = levelsCount;

  rootEl = document.getElementById("levelsOverlay");
  if (!rootEl) {
    console.warn("[LevelsUI] #levelsOverlay not found");
    return null;
  }

  gridEl = rootEl.querySelector(".levelsGrid");
  if (!gridEl) {
    console.warn("[LevelsUI] .levelsGrid not found");
    return null;
  }

  return {
    open,
    close,
    refresh,
  };
}

function open() {
  if (!rootEl) return;
  rootEl.classList.remove("hidden");
  refresh();
}

function close() {
  if (!rootEl) return;
  rootEl.classList.add("hidden");
}

function refresh() {
  if (!gridEl) return;

  const unlocked =
    Number(window.__progress?.level || 1);

  gridEl.innerHTML = "";

  for (let i = 1; i <= totalLevels; i++) {
    const btn = document.createElement("button");
    btn.className = "levelTile";

    if (i < unlocked) {
      btn.classList.add("done");
      btn.innerHTML = "✓";
      btn.onclick = () => onSelectLevel(i - 1);
    } else if (i === unlocked) {
      btn.classList.add("current");
      btn.textContent = i;
      btn.onclick = () => onSelectLevel(i - 1);
    } else {
      btn.classList.add("locked");
      btn.innerHTML = "🔒";
      btn.disabled = true;
    }

    gridEl.appendChild(btn);
  }
}