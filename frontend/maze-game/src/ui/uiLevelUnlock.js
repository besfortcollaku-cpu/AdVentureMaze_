import "../css/restart.css";

const LEVEL_UNLOCK_COST = 25;

export function createLevelUnlockPopup() {
  const el = document.createElement("div");
  el.className = "popup hidden";
  el.innerHTML = `
    <div class="popup-card">
      <h3>Unlock More Levels</h3>
      <div class="popup-balance" id="levelUnlockCoinsBalance">Your Coins: 0</div>
      <div class="popup-note" id="levelUnlockNote">Unlock 2 more levels now.</div>
      <div class="popup-subnote" id="levelUnlockSubnote">Or wait for timed unlocks.</div>
      <button id="buyLevelUnlockBtn">Unlock with 25 Coins</button>
      <button id="watchAdLevelUnlockBtn">Watch Ad to Unlock</button>
      <button id="closeLevelUnlockBtn">Close</button>
    </div>
  `;
  document.body.appendChild(el);

  const api = {
    open({ coins = 0, unlockLevels = 2 } = {}) {
      el.classList.remove("hidden");

      const buyBtn = el.querySelector("#buyLevelUnlockBtn");
      const adBtn = el.querySelector("#watchAdLevelUnlockBtn");
      const balanceEl = el.querySelector("#levelUnlockCoinsBalance");
      const noteEl = el.querySelector("#levelUnlockNote");
      const subnoteEl = el.querySelector("#levelUnlockSubnote");

      if (balanceEl) {
        balanceEl.textContent = `Your Coins: ${Number(coins || 0)}`;
      }

      if (noteEl) {
        noteEl.textContent = `Unlock ${unlockLevels} more ${unlockLevels === 1 ? "level" : "levels"} now.`;
      }

      if (subnoteEl) {
        subnoteEl.textContent = Number(coins || 0) >= LEVEL_UNLOCK_COST
          ? "Or wait for timed unlocks."
          : "Not enough Coins. You can still watch an ad or wait.";
      }

      if (buyBtn) {
        buyBtn.disabled = Number(coins || 0) < LEVEL_UNLOCK_COST;
        buyBtn.textContent = `Unlock with ${LEVEL_UNLOCK_COST} Coins`;
      }

      if (adBtn) {
        adBtn.disabled = false;
        adBtn.textContent = "Watch Ad to Unlock";
      }
    },
    hide() {
      el.classList.add("hidden");
    },
    onBuy(cb) {
      el.querySelector("#buyLevelUnlockBtn").onclick = cb;
    },
    onWatchAd(cb) {
      el.querySelector("#watchAdLevelUnlockBtn").onclick = cb;
    },
  };

  el.querySelector("#closeLevelUnlockBtn").onclick = () => api.hide();

  return api;
}
