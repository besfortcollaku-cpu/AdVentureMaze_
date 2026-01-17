// src/ui/uiLevels.js
import { loadLevel } from "../levels/index.js";

export function mountLevelsUI(root, user) {
  const completed = user?.completed_levels ?? 0;

  const overlay = document.createElement("div");
  overlay.className = "levelsOverlay active";

  overlay.innerHTML = `
    <div class="levelsCard">
      <div class="levelsBadge">LEVELS</div>
      <h2>Select Level</h2>

      <div class="levelsGrid">
        ${Array.from({ length: 9 }).map((_, i) => {
          const levelNum = i + 1;

          if (levelNum <= completed) {
            return `
              <button class="levelBtn done" data-level="${levelNum}">
                ✓ Level ${levelNum}
              </button>
            `;
          }

          if (levelNum === completed + 1) {
            return `
              <button class="levelBtn unlocked" data-level="${levelNum}">
                Level ${levelNum}
              </button>
            `;
          }

          return `
            <button class="levelBtn locked" disabled>
              🔒 ${levelNum}
            </button>
          `;
        }).join("")}
      </div>

      <button class="closeBtn">Close</button>
    </div>
  `;

  root.appendChild(overlay);

  // 🎮 Click handling
  overlay.addEventListener("click", (e) => {
    const btn = e.target.closest(".levelBtn");
    if (!btn || btn.disabled) return;

    const level = Number(btn.dataset.level);
    if (!level) return;

    overlay.remove(); // close levels UI
    loadLevel(level); // 🚀 REAL LEVEL LOAD
  });

  overlay.querySelector(".closeBtn").onclick = () => {
    overlay.remove();
  };

  return {
    show() {
      overlay.classList.add("active");
    },
    hide() {
      overlay.classList.remove("active");
    },
  };
}