import "../css/skip.css";

export function createSkipPopup() {
  const overlay = document.createElement("div");
  overlay.className = "skipOverlay hidden";

  overlay.innerHTML = `
    <div class="skipCard">
      <h2>Skip Level</h2>

      <button id="skipFreeBtn">
        ⏭ Free Skip <span id="skipFreeCount">x0</span>
      </button>

      <button id="skipCoinsBtn">
        🪙 Skip for 50 coins
      </button>

      <button id="skipAdBtn">
        ▶ Watch Ad — Skip
      </button>

      <button id="skipCloseBtn">Close</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const freeBtn = overlay.querySelector("#skipFreeBtn");
  const coinsBtn = overlay.querySelector("#skipCoinsBtn");
  const adBtn = overlay.querySelector("#skipAdBtn");
  const closeBtn = overlay.querySelector("#skipCloseBtn");
  const countEl = overlay.querySelector("#skipFreeCount");

  let freeHandler = null;
  let buyHandler = null;
  let adHandler = null;

  closeBtn.onclick = hide;

  freeBtn.onclick = () => freeHandler?.();
  coinsBtn.onclick = () => buyHandler?.();
  adBtn.onclick = () => adHandler?.();

  function show({ freeLeft }) {
    countEl.textContent = `x${freeLeft}`;
    freeBtn.disabled = freeLeft <= 0;
    overlay.classList.remove("hidden");
  }

  function hide() {
    overlay.classList.add("hidden");
  }

  return {
    show,
    hide,
    onFreeSkip(cb) {
      freeHandler = cb;
    },
    onBuySkip(cb) {
      buyHandler = cb;
    },
    onWatchAdSkip(cb) {
      adHandler = cb;
    },
  };
}