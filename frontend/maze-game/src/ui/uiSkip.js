// uiSkip.js
import "./css/skip.css";

export function mountSkipUI(root) {
  // ----- DOM -----
  const overlay = document.createElement("div");
  overlay.className = "skipOverlay";

  overlay.innerHTML = `
    <div class="skipCard">
      <h2>Skip Level</h2>

      <button class="skipOption primary" id="skipFreeBtn">
        ⏭ Skip Free <span id="skipFreeCount">x3</span>
      </button>

      <button class="skipOption secondary" id="skipPaidBtn">
        🪙 Skip for 50 coins
      </button>

      <button class="skipOption ad" id="skipAdBtn">
        ▶ Watch Ad — Skip
      </button>

      <button class="closeBtn" id="skipCloseBtn">Close</button>
    </div>
  `;

  root.appendChild(overlay);

  // ----- ELEMENTS -----
  const freeCountEl = overlay.querySelector("#skipFreeCount");
  const freeBtn = overlay.querySelector("#skipFreeBtn");
  const paidBtn = overlay.querySelector("#skipPaidBtn");
  const adBtn = overlay.querySelector("#skipAdBtn");
  const closeBtn = overlay.querySelector("#skipCloseBtn");

  // ----- STATE -----
  let freeSkips = 3;

  // ----- HELPERS -----
  function render() {
    freeCountEl.textContent = `x${freeSkips}`;
    freeBtn.disabled = freeSkips <= 0;
  }

  function open() {
    document.body.classList.add("overlay-open");
    overlay.style.display = "flex";
    render();
  }

  function close() {
    document.body.classList.remove("overlay-open");
    overlay.style.display = "none";
  }

  // ----- EVENTS -----
  closeBtn.addEventListener("click", close);

  freeBtn.addEventListener("click", () => {
    if (freeSkips <= 0) return;
    freeSkips--;
    render();
    // actual skip logic comes later
    close();
  });

  paidBtn.addEventListener("click", () => {
    // coin logic later
    close();
  });

  adBtn.addEventListener("click", () => {
    // rewarded ad later
    close();
  });

  // ----- PUBLIC API -----
  return {
    open,
    close,

    setFreeSkips(n) {
      freeSkips = Math.max(0, n ?? 0);
      render();
    },
  };
}