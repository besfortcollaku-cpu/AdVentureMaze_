
// uiLevels.js
import "../css/levels.css";
import { levels as LEVELS } from "../levels/index.js";

export function mountLevelsUI(root) {
  // ----- DOM -----
  const overlay = document.createElement("div");
  overlay.id = "levelsOverlay";
  overlay.className = "levelsOverlay";

  overlay.innerHTML = `
    <div class="levelsCard">
      <div class="levelsHeader">
        <span class="badge">LEVELS</span>
        <h2>Select</h2>
      </div>

      <div class="levelsGrid" id="levelsGrid"></div>

      <button class="closeBtn" id="levelsClose">Close</button>
    </div>
  `;

  root.appendChild(overlay);

  const grid = overlay.querySelector("#levelsGrid");
  const closeBtn = overlay.querySelector("#levelsClose");

  // ----- STATE -----
  let maxUnlocked = 1;
  let selectHandler = null;

  // real total levels from src/levels/index.js
  const TOTAL_LEVELS = Array.isArray(LEVELS) && LEVELS.length > 0 ? LEVELS.length : 55;

  // ----- BUILD GRID ONCE -----
  const levelButtons = [];

  for (let i = 1; i <= TOTAL_LEVELS; i++) {
    const btn = document.createElement("button");
    btn.className = "levelBtn";
    btn.dataset.level = String(i);

    // IMPORTANT: single content only (no "Level" text, no extra inner squares)
    btn.textContent = String(i);

    btn.addEventListener("click", () => {
      const level = Number(btn.dataset.level || 0);

      // locked behavior (guest gating)
      if (btn.classList.contains("locked")) {
        const maze = window.__maze;
        const guestMax = Number(maze?.guestMaxLevel || 0);
        const isLoggedIn = maze?.isLoggedIn?.() === true;

        if (!isLoggedIn && guestMax > 0 && level > guestMax) {
          maze?.showLoginRequired?.();
        }
        return;
      }

      selectHandler?.(level);
      close();
    });

    grid.appendChild(btn);
    levelButtons.push(btn);
  }

  // ----- RENDER STATES -----
  function render() {
    for (const btn of levelButtons) {
      const level = Number(btn.dataset.level);

      btn.classList.remove("locked", "completed", "unlocked", "current");

      if (level < maxUnlocked) {
        // completed => ✓ only (no number)
        btn.classList.add("completed");
        btn.textContent = "✓";
        btn.setAttribute("aria-label", `Level ${level} completed`);
      } else if (level === maxUnlocked) {
        // current unlocked => number only
        btn.classList.add("unlocked", "current");
        btn.textContent = String(level);
        btn.setAttribute("aria-label", `Level ${level}`);
      } else {
        // locked => empty content (lock badge should be CSS ::after)
        btn.classList.add("locked");
        btn.textContent = "";
        btn.setAttribute("aria-label", `Level ${level} locked`);
      }
    }
  }

  // ----- OPEN / CLOSE -----
  function open() {
    document.body.classList.add("overlay-open");
    overlay.style.display = "flex";
  }

  function close() {
    document.body.classList.remove("overlay-open");
    overlay.style.display = "none";
  }

  closeBtn.addEventListener("click", close);

  // initial render
  render();

  // ----- PUBLIC API -----
  return {
    open,
    close,

    setUnlocked(level) {
      maxUnlocked = Math.max(1, Number(level) || 1);
      render();
    },

    onSelect(cb) {
      selectHandler = cb;
    },
  };
}