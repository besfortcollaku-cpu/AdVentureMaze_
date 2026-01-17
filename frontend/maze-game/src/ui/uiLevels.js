// src/ui/uiLevels.js
// Level selection popup UI

export function createLevelSelectUI() {
  let onSelectCb = null;

  // ---------------------------
  // HTML
  // ---------------------------
  const el = document.createElement("div");
  el.className = "overlay levelSelectOverlay hidden";

  el.innerHTML = `
    <div class="modal levelSelectModal">
      <div class="badge red">LEVELS</div>
      <h2>Select Level</h2>

      <div class="levelsGrid" id="levelsGrid"></div>

      <button class="btn primary closeBtn">Close</button>
    </div>
  `;

  document.body.appendChild(el);

  const grid = el.querySelector("#levelsGrid");
  const closeBtn = el.querySelector(".closeBtn");

  // ---------------------------
  // Events
  // ---------------------------
  closeBtn.addEventListener("click", hide);

  function onLevelClick(index) {
    if (onSelectCb) onSelectCb(index);
    hide();
  }

  // ---------------------------
  // API
  // ---------------------------
  function show({ totalLevels, currentLevel, isCompleted }) {
    grid.innerHTML = "";

    for (let i = 0; i < totalLevels; i++) {
      const lvl = i + 1;
      const btn = document.createElement("button");
      btn.className = "levelBtn";

      const completed = isCompleted?.(lvl);
      const locked = lvl > currentLevel + 1;

      if (completed) {
        btn.innerHTML = `✔️<span>Level ${lvl}</span>`;
        btn.classList.add("completed");
      } else if (locked) {
        btn.innerHTML = `🔒<span>${lvl}</span>`;
        btn.classList.add("locked");
        btn.disabled = true;
      } else {
        btn.innerHTML = `<span>Level ${lvl}</span>`;
      }

      if (!locked) {
        btn.addEventListener("click", () => onLevelClick(i));
      }

      grid.appendChild(btn);
    }

    el.classList.remove("hidden");
  }

  function hide() {
    el.classList.add("hidden");
  }

  function onSelect(cb) {
    onSelectCb = cb;
  }

  return {
    show,
    hide,
    onSelect,
  };
}