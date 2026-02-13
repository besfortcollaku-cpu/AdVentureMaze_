import "../css/restart.css";
export function createRestartPopup() {
  const el = document.createElement("div");
  el.className = "popup hidden";
  el.innerHTML = `
    <div class="popup-card">
      <h3>Restart Level</h3>
      <<button id="freeRestartBtn">Free Restart</button>
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

    onFreeRestart(cb) {
  el.querySelector("#freeRestartBtn").onclick = cb;
},
onBuyRestart(cb) {
  el.querySelector("#buyRestartBtn").onclick = cb;
},
onWatchAdRestart(cb) {
  el.querySelector("#watchAdRestartBtn").onclick = cb;
},

  el.querySelector("#closeRestartBtn").onclick = () => api.hide();

  return api;
}