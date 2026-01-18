// src/ui/uiLevels.js
import "../css/levels.css";

export function mountLevelsUI(root, options = {}) {
  const {
    unlockedLevels = 1,
    completedLevels = [],
    onSelectLevel = () => {},
  } = options;

  // ===== Overlay =====
  const overlay = document.createElement("div");
  overlay.className = "levelsOverlay";

  overlay.innerHTML = `
    <div class="levelsModal">
      <div class="levelsHeader">
        <div class="levelsBadge">LEVELS</div>
        <div class="levelsTitle">Select Level</div>
      </div>

      <div class="levelsGrid"></div>

      <button class="levelsClose">Close</button>
    </div>
  `;

  root.appendChild(overlay);

  const grid = overlay.querySelector(".levelsGrid");
  const closeBtn = overlay.querySelector(".levelsClose");

  // ===== Build levels =====
  for (let level = 1; level <= 9; level++) {
    const btn = document.createElement("button");
    btn.classList.add("levelBtn");

    const isUnlocked = level <= unlockedLevels;
    const isCompleted = completedLevels.includes(level);

    if (!isUnlocked) {
      btn.classList.add("locked");
      btn.innerHTML = `
        <span class="levelNumber">${level}</span>
        <span class="lockIcon">🔒</span>
      `;
    } else {
      btn.classList.add("unlocked");
      btn.innerHTML = `
        <span class="levelNumber">Level ${level}</span>
        ${isCompleted ? `<span class="checkIcon">✓</span>` : ""}
      `;

      btn.addEventListener("click", () => {
        hide();
        onSelectLevel(level);
      });
    }

    grid.appendChild(btn);
  }

  // ===== Close =====
  closeBtn.addEventListener("click", hide);

  function hide() {
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    setTimeout(() => overlay.remove(), 200);
  }

  return { hide };
}