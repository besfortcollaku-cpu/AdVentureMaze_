// src/ui/uiLevels.js

import { loadLevel } from "../levels/index.js";

export function mountLevelsUI(root) {
  // ---------- DOM ----------
  const overlay = document.createElement("div");
  overlay.className = "levelSelectOverlay";

  overlay.innerHTML = `
    <div class="welcomeCard">
      <div style="margin-bottom:10px;">
        <span class="levelNew">LEVELS</span>
      </div>

      <div class="welcomeTitle">Select Level</div>

      <div class="levelGrid" id="levelGrid"></div>

      <button class="welcomeBtn" id="closeLevels">Close</button>
    </div>
  `;

  root.appendChild(overlay);

  const grid = overlay.querySelector("#levelGrid");
  const closeBtn = overlay.querySelector("#closeLevels");

  let onSelectHandler = null;

  // ---------- BUILD GRID ----------
  function buildLevels({ totalLevels, currentLevel, completedLevels }) {
    grid.innerHTML = "";

    for (let i = 1; i <= totalLevels; i++) {
      const btn = document.createElement("button");
      btn.className = "levelBtn";
      btn.textContent = `Level ${i}`;

      const isCompleted = completedLevels.includes(i);
      const isLocked = i > currentLevel + 1;

      if (isCompleted) {
        btn.innerHTML = `✓ Level ${i}`;
      }

      if (i === currentLevel) {
        btn.classList.add("current");
      }

      if (isLocked) {
        btn.classList.add("locked");
        btn.disabled = true;
      } else {
        btn.addEventListener("click", () => {
          hide();
          loadLevel(i); // 🔥 REAL LEVEL LOAD
          onSelectHandler && onSelectHandler(i);
        });
      }

      grid.appendChild(btn);
    }
  }

  // ---------- VISIBILITY ----------
  function show(config) {
    const {
      totalLevels = 9,
      currentLevel = 1,
      completedLevels = [],
    } = config;

    buildLevels({ totalLevels, currentLevel, completedLevels });
    overlay.classList.add("show");
  }

  function hide() {
    overlay.classList.remove("show");
  }

  closeBtn.addEventListener("click", hide);

  // ---------- API ----------
  return {
    show,
    hide,
    onSelect(fn) {
      onSelectHandler = fn;
    },
  };
}