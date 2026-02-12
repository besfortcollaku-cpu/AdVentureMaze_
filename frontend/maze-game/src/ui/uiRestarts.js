import "../css/restart.css";
export function createRestartsPopup() {
  const el = document.createElement("div");
  el.className = "popup hidden";
  el.innerHTML = `
    <div class="popup-card">
      <h3>Restart Level</h3>
      <button id="freeTestartBtn">Free Skip</button>
      <button id="buyRestartBtn">Buy Testarts</button>
      <button id="watchAdRestartBtn">Watch Ad</button>
      <button id="closeRestartBtn">Close</button>
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

    onFreeSkip(cb) {
      el.querySelector("#freeRestartBtn").onclick = cb;
    },
    onBuySkip(cb) {
      el.querySelector("#buyRestartBtn").onclick = cb;
    },
    onWatchAdSkip(cb) {
      el.querySelector("#watchAdRestartBtn").onclick = cb;
    },
  };

  el.querySelector("#closeRestartBtn").onclick = () => api.hide();

  return api;
}