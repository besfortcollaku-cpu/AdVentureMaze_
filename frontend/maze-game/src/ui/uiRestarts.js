import "../css/restart.css";

const RESTART_COST = 15;

export function createRestartPopup() {
  const el = document.createElement("div");
  el.className = "popup hidden";
  el.innerHTML = `
    <div class="popup-card">
      <h3>Restart Level</h3>
      <div class="popup-balance" id="restartCoinsBalance">Your Coins: 0</div>
      <div class="popup-note">Restart Level - ${RESTART_COST} Coins</div>
      <div class="popup-subnote">Restarts cost Coins but do not reduce Score on their own.</div>
      <button id="buyRestartBtn">Buy Restart</button>
      <button id="watchAdRestartBtn">Watch Ad</button>
      <button id="closeRestartBtn">Close</button>
    </div>
  `;
  document.body.appendChild(el);

  let onFreeRestart = null;
const closeBtn = el.querySelector("#closeRestartBtn");
closeBtn.addEventListener("click", () => {
  api.hide();
});
const api = {
open({ coins } = {}) {
  el.classList.remove("hidden");

  const buyBtn = el.querySelector("#buyRestartBtn");
  const adBtn = el.querySelector("#watchAdRestartBtn");
  const balanceEl = el.querySelector("#restartCoinsBalance");

  if (balanceEl) {
    balanceEl.textContent = `Your Coins: ${Number(coins || 0)}`;
  }

  if (coins < RESTART_COST) {
    buyBtn.disabled = true;
    buyBtn.textContent = `Restart Level - ${RESTART_COST} Coins`;
  } else {
    buyBtn.disabled = false;
    buyBtn.textContent = `Restart Level - ${RESTART_COST} Coins`;
  }

  adBtn.disabled = false;
  adBtn.textContent = "Watch Ad Instead";
},
  hide() {
    el.classList.add("hidden");
  },

  onFreeRestart(cb) {
    onFreeRestart = cb;
  },

  onBuyRestart(cb) {
    el.querySelector("#buyRestartBtn").onclick = cb;
  },

  onWatchAdRestart(cb) {
    el.querySelector("#watchAdRestartBtn").onclick = cb;
  },
};

  return api;
}
