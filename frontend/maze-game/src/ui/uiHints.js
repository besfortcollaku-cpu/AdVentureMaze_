export function mountHintsUI({ root }) {
  const el = root.querySelector("#hintPopup");
  const btnFree = el.querySelector("[data-hint-free]");
  const btnBuy = el.querySelector("[data-hint-buy]");
  const btnAd = el.querySelector("[data-hint-ad]");
  const btnClose = el.querySelector("[data-close]");

  let onFree = () => {};
  let onBuy = () => {};
  let onAd = () => {};

  function show({ freeLeft = 0 } = {}) {
    el.classList.add("show");

    // update free counter if exists
    const freeLabel = el.querySelector("[data-free-left]");
    if (freeLabel) freeLabel.textContent = freeLeft;
  }

  function hide() {
    el.classList.remove("show");
  }

  btnFree?.addEventListener("click", () => onFree());
  btnBuy?.addEventListener("click", () => onBuy());
  btnAd?.addEventListener("click", () => onAd());
  btnClose?.addEventListener("click", hide);

  return {
    show,
    hide,

    onFreeHint(fn) {
      onFree = fn;
    },
    onBuyHint(fn) {
      onBuy = fn;
    },
    onWatchAdHint(fn) {
      onAd = fn;
    },
  };
}