// src/ui/uiLevels.js
import { loadLevel } from "../levels/index.js";

export function mountLevelsUI(root, user) {
  const completed = user?.completed_levels ?? 0;

  const overlay = document.createElement("div");
  overlay.className = "overlay active levelsOverlay";

  overlay.innerHTML = `
    <div class="modal levelsModal">
      <div class="modalHeader">
        <span class="badge red">LEVELS</span>
        <h2>Select Level</h2>
      </div>

      <div class="levels">
        ${Array.from({ length: 9 }).map((_, i) => {
          const level = i + 1;

          if (level <= completed) {
            return `
              <button class="level done" data-level="${level}">
                ✓ Level ${level}
              </button>
            `;
          }

          if (level === completed + 1) {
            return `
              <button class="level unlocked" data-level="${level}">
                Level ${level}
              </button>
            `;
          }

          return `
            <button class="level locked" disabled>
              🔒 ${level}
            </button>
          `;
        }).join("")}
      </div>

      <button class="modalClose">Close</button>
    </div>
  `;

  root.appendChild(overlay);

  overlay.addEventListener("click", (e) => {
    const btn = e.target.closest(".level");
    if (!btn || btn.disabled) return;

    const level = Number(btn.dataset.level);
    if (!level) return;

    overlay.remove();
    loadLevel(level);
  });

  overlay.querySelector(".modalClose").onclick = () => {
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