import "../css/restart.css";

export function createRestartPopup() {
  const el = document.createElement("div");
  el.className = "popup hidden";
  el.innerHTML = `
    <div class="popup-card">
      <h3>Restart Level</h3>
      <button id="buyRestartBtn">Buy Restart</button>
      <button id="watchAdRestartBtn">Watch Ad</button>
      <button id="closeRestartBtn">Close</button>
    </div>
  `;
  document.body.appendChild(el);

  const api = {
    open({ coins } = {}) {
      el.classList.remove("hidden");

      const buyBtn = el.querySelector("#buyRestartBtn");
      const adBtn = el.querySelector("#watchAdRestartBtn");

      // Paid restart
      if (coins < 50) {
        buyBtn.disabled = true;
        buyBtn.textContent = "Not enough coins";
      } else {
        buyBtn.disabled = false;
        buyBtn.textContent = "Restart (50 coins)";
      }

      // Ad always enabled
      adBtn.disabled = false;
      adBtn.textContent = "Watch Ad";
    },

    hide() {
      el.classList.add("hidden");
    },

    onBuyRestart(cb) {
      el.querySelector("#buyRestartBtn").onclick = cb;
    },

    onWatchAdRestart(cb) {
      el.querySelector("#watchAdRestartBtn").onclick = cb;
    },
  };

  el.querySelector("#closeRestartBtn").onclick = () => api.hide();

  return api;
}