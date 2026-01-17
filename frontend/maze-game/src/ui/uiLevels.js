// src/ui/uiLevels.js

import "../css/levels.css";

export function mountLevelsUI(root, options = {}) {
  const {
    unlockedLevels = 1,        // number of unlocked levels
    completedLevels = [],      // array like [1,2,3]
    onSelectLevel = () => {},  // callback(levelNumber)
  } = options;

  // --- DOM ---
  const overlay = document.createElement("div");
  overlay.className = "overlay active";

  overlay.innerHTML = `
    <<div class="levelsOverlay">
  <div class="levelsModal">
    <div class="levelsHeader">
      <div class="levelsBadge">LEVELS</div>
      <div class="levelsTitle">Select Level</div>
    </div>

    <div class="levelsGrid">
      <button class="levelTile completed">Level 1</button>
      <button class="levelTile completed">Level 2</button>
      <button class="levelTile locked">5</button>
    </div>

    <button class="levelsClose">Close</button>
  </div>
</div>
  `;

  root.appendChild(overlay);

  const grid = overlay.querySelector(".levelsGrid");
  const closeBtn = overlay.querySelector(".levelsCloseBtn");

  // --- Build Levels ---
  for (let level = 1; level <= 9; level++) {
    const btn = document.createElement("button");
    btn.className = "levelBtn";

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

  // --- Close ---
  closeBtn.addEventListener("click", hide);

  function hide() {
    overlay.classList.remove("active");
    overlay.style.pointerEvents = "none";
    setTimeout(() => overlay.remove(), 200);
  }

  return {
    hide,
  };
}