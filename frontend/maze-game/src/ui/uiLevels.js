export function mountLevelsUI(root) {
  const el = document.createElement("div");
  el.id = "levelsOverlay";
  el.className = "levels-overlay hidden";

  el.innerHTML = `
    <div class="levels-card">
      <h2>Select Level</h2>

      <div class="levels-grid">
        ${Array.from({ length: 20 }, (_, i) => `
          <button class="level-btn locked" data-level="${i + 1}">
            ${i + 1}
          </button>
        `).join("")}
      </div>

      <button id="closeLevels" class="close-btn">Close</button>
    </div>
  `;

  root.appendChild(el);

  const closeBtn = el.querySelector("#closeLevels");

  function open() {
    document.body.classList.add("blurred");
    el.classList.remove("hidden");
  }

  function close() {
    document.body.classList.remove("blurred");
    el.classList.add("hidden");
  }

  closeBtn.addEventListener("click", close);

  return {
    open,
    close,
    setUnlocked(maxLevel = 1) {
      el.querySelectorAll(".level-btn").forEach(btn => {
        const lvl = Number(btn.dataset.level);
        if (lvl <= maxLevel) {
          btn.classList.remove("locked");
          btn.classList.add("unlocked");
        }
      });
    },
  };
}