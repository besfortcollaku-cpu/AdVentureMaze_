export function createHintPopup() {
  const el = document.createElement("div");
  el.className = "popup hidden";
  el.innerHTML = `
    <div class="popup-card">
      <h3>Hint</h3>
      <button id="freeHintBtn">Free Hint</button>
      <button id="buyHintBtn">Buy Hint</button>
      <button id="watchAdHintBtn">Watch Ad</button>
      <button id="closeHintBtn">Close</button>
    </div>
  `;
  document.body.appendChild(el);

  const api = {
    show({ freeLeft } = {}) {
      el.classList.remove("hidden");
    },
    hide() {
      el.classList.add("hidden");
    },

    // 🔥 CRITICAL FIX
    open(opts) {
      this.show(opts);
    },

    onFreeHint(cb) {
      el.querySelector("#freeHintBtn").onclick = cb;
    },
    onBuyHint(cb) {
      el.querySelector("#buyHintBtn").onclick = cb;
    },
    onWatchAdHint(cb) {
      el.querySelector("#watchAdHintBtn").onclick = cb;
    },
  };

  el.querySelector("#closeHintBtn").onclick = () => api.hide();

  return api;
}