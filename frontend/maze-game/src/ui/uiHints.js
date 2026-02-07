export function createHintPopup() {
  const root = document.body;

  const overlay = document.createElement("div");
  overlay.className = "overlay hint-overlay hidden";
  overlay.innerHTML = `
    <div class="popup">
      <h2>Get Hint</h2>
      <p class="free-info"></p>
      <button class="free-btn">Use free hint</button>
      <button class="buy-btn">Spend 50 coins</button>
      <button class="ad-btn">Watch ad</button>
      <button class="close-btn">Close</button>
    </div>
  `;

  root.appendChild(overlay);

  const freeInfo = overlay.querySelector(".free-info");
  const freeBtn = overlay.querySelector(".free-btn");
  const buyBtn = overlay.querySelector(".buy-btn");
  const adBtn = overlay.querySelector(".ad-btn");
  const closeBtn = overlay.querySelector(".close-btn");

  let onFree = null;
  let onBuy = null;
  let onAd = null;

  function show({ freeLeft = 0 }) {
    freeInfo.textContent =
      freeLeft > 0
        ? `Free hints left: ${freeLeft}`
        : "No free hints left";

    freeBtn.disabled = freeLeft <= 0;
    overlay.classList.remove("hidden");
  }

  function hide() {
    overlay.classList.add("hidden");
  }

  freeBtn.addEventListener("click", () => {
    hide();
    onFree && onFree();
  });

  buyBtn.addEventListener("click", () => {
    hide();
    onBuy && onBuy();
  });

  adBtn.addEventListener("click", () => {
    hide();
    onAd && onAd();
  });

  closeBtn.addEventListener("click", hide);

  return {
    show,
    hide,
    onFreeHint(cb) {
      onFree = cb;
    },
    onBuyHint(cb) {
      onBuy = cb;
    },
    onWatchAdHint(cb) {
      onAd = cb;
    },
  };
}