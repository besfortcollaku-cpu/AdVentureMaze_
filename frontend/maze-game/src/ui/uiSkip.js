export function mountSkipUI({ root }) {
  const el = root.querySelector("#skipPopup");
  const btnFree = el.querySelector("[data-skip-free]");
  const btnBuy = el.querySelector("[data-skip-buy]");
  const btnAd = el.querySelector("[data-skip-ad]");
  const btnClose = el.querySelector("[data-close]");

  let onFree = () => {};
  let onBuy = () => {};
  let onAd = () => {};

  function show({ freeLeft = 0 } = {}) {
    el.classList.add("show");

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

    onFreeSkip(fn) {
      onFree = fn;
    },
    onBuySkip(fn) {
      onBuy = fn;
    },
    onWatchAdSkip(fn) {
      onAd = fn;
    },
  };
}