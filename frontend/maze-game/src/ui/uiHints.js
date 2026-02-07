export function createHintPopup() {
  let onFree = null;
  let onBuy = null;
  let onAd = null;

  const el = document.createElement("div");
  el.className = "popup hidden";
  el.innerHTML = `
    <div class="popup-card">
      <h2>Hint</h2>
      <button class="free">Free (<span class="freeLeft"></span>)</button>
      <button class="buy">Buy</button>
      <button class="ad">Watch Ad</button>
      <button class="close">Close</button>
    </div>
  `;
  document.body.appendChild(el);

  el.querySelector(".close").onclick = () => hide();
  el.querySelector(".free").onclick = () => onFree?.();
  el.querySelector(".buy").onclick = () => onBuy?.();
  el.querySelector(".ad").onclick = () => onAd?.();

  function show({ freeLeft }) {
    el.querySelector(".freeLeft").textContent = freeLeft ?? 0;
    el.classList.remove("hidden");
  }

  function hide() {
    el.classList.add("hidden");
  }

  return {
    show,
    hide,
    onFreeHint(cb) { onFree = cb; },
    onBuyHint(cb) { onBuy = cb; },
    onWatchAdHint(cb) { onAd = cb; },
  };
}