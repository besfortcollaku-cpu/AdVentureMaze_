// uiLevels.js
import "../css/levels.css";

export function mountLevelsUI(root) {
  // ----- DOM -----
  const overlay = document.createElement("div");
  overlay.id = "levelsOverlay";
  overlay.className = "levelsOverlay";

  overlay.innerHTML = `
    <div class="levelsCard">
      <div class="levelsHeader">
        <span class="badge">LEVELS</span>
        <h2>Select Level</h2>
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
  const TOTAL_LEVELS = 20;

  // ----- BUILD GRID ONCE -----
  const levelButtons = [];

  for (let i = 1; i <= TOTAL_LEVELS; i++) {
    const btn = document.createElement("button");
    btn.className = "levelBtn";
    btn.dataset.level = i;

    btn.innerHTML = `
      <span class="icon"></span>
      <span class="label">Level ${i}</span>
    `;

    btn.addEventListener("click", () => {
  // 🔒 Locked levels
  if (btn.classList.contains("locked")) {
    // Guest trying to access levels > 5
    if (i > 5 && window.ui?.showLoginRequired) {
      window.ui.showLoginRequired();
    }
    return;
  }

  // Allowed level
  selectHandler?.(i);
  close();
});

    grid.appendChild(btn);
    levelButtons.push(btn);
  }

  // ----- RENDER STATES -----
  function render() {
    levelButtons.forEach((btn) => {
      const level = Number(btn.dataset.level);
      btn.classList.remove("locked", "completed", "unlocked");

      const icon = btn.querySelector(".icon");

      if (level < maxUnlocked) {
        btn.classList.add("completed");
        icon.textContent = "✔️";
      } else if (level === maxUnlocked) {
        btn.classList.add("unlocked");
        icon.textContent = "";
      } else {
        btn.classList.add("locked");
        icon.textContent = "🔒";
      }
    });
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

  // ----- PUBLIC API -----
  return {
    open,
    close,

    setUnlocked(level) {
      maxUnlocked = Math.max(1, level || 1);
      render();
    },

    onSelect(cb) {
      selectHandler = cb;
    },
  };
}