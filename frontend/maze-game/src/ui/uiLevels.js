// src/ui/uiLevels.js
import { loadLevel } from "../levels/index.js";

export function mountLevelsUI(root, user) {
  const completed = user?.completed_levels ?? 0;

  const overlay = document.createElement("div");
  overlay.className = "levelsOverlay active";

  overlay.innerHTML = `
    <div class="levelsCard">
      <div class="levelsHeader">
        <span class="levelsBadge">LEVELS</span>
        <h2>Select Level</h2>
      </div>

      <div class="levelsGrid">
        ${Array.from({ length: 9 }).map((_, i) => {
          const level = i + 1;

          // ✅ completed
          if (level <= completed) {
            return `
              <div class="levelItem done" data-level="${level}">
                ✓<span>Level ${level}</span>
              </div>
            `;
          }

          // 🔓 next unlocked
          if (level === completed + 1) {
            return `
              <div class="levelItem unlocked" data-level="${level}">
                <span>Level ${level}</span>
              </div>
            `;
          }

          // 🔒 locked
          return `
            <div class="levelItem locked">
              🔒<span>${level}</span>
            </div>
          `;
        }).join("")}
      </div>

      <button class="closeBtn">Close</button>
    </div>
  `;

  root.appendChild(overlay);

  // 🎮 Handle clicks
  overlay.addEventListener("click", (e) => {
    const item = e.target.closest(".levelItem");
    if (!item) return;
    if (item.classList.contains("locked")) return;

    const level = Number(item.dataset.level);
    if (!level) return;

    overlay.remove();       // remove levels UI
    loadLevel(level);      // 🚀 load real level
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