export function createSkipPopup() {
  const root = document.body;

  const overlay = document.createElement("div");
  overlay.className = "overlay skip-overlay hidden";
  overlay.innerHTML = `
    <div class="popup">
      <h2>Skip Level</h2>
      <p class="free-info"></p>
      <button class="free-btn">Use free skip</button>
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
        ? `Free skips left: ${freeLeft}`
        : "No free skips left";

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
    onFreeSkip(cb) {
      onFree = cb;
    },
    onBuySkip(cb) {
      onBuy = cb;
    },
    onWatchAdSkip(cb) {
      onAd = cb;
    },
  };
}