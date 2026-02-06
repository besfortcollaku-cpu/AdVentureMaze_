import "../css/hints.css";

export function createHintPopup() {
  const overlay = document.createElement("div");
  overlay.className = "hintsOverlay hidden";

  overlay.innerHTML = `
    <div class="hintsCard">
      <h2>Hint</h2>

      <button id="hintFreeBtn">
        ❓ Free Hint <span id="hintFreeCount">x0</span>
      </button>

      <button id="hintCoinsBtn">
        🪙 Get 1 Hint – 50 coins
      </button>

      <button id="hintAdBtn">
        📺 Watch ad – Get 1 Hint
      </button>

      <button id="hintCloseBtn">Close</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const freeBtn = overlay.querySelector("#hintFreeBtn");
  const coinsBtn = overlay.querySelector("#hintCoinsBtn");
  const adBtn = overlay.querySelector("#hintAdBtn");
  const closeBtn = overlay.querySelector("#hintCloseBtn");
  const countEl = overlay.querySelector("#hintFreeCount");

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
    onFreeHint(cb) {
      freeHandler = cb;
    },
    onBuyHint(cb) {
      buyHandler = cb;
    },
    onWatchAdHint(cb) {
      adHandler = cb;
    },
  };
}