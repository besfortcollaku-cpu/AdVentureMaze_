import "../css/hints.css";

const HINT_COST = 15;

export function createHintPopup() {
  const el = document.createElement("div");
  el.className = "popup hidden";
  el.innerHTML = `
    <div class="popup-card">
      <h3>Hint</h3>
      <div class="popup-balance" id="hintCoinsBalance">Your Coins: 0</div>
      <div class="popup-note">Use Hint - ${HINT_COST} Coins</div>
      <div class="popup-subnote">Hints reduce Score for this run.</div>
      <button id="freeHintBtn">Free Hint</button>
      <button id="buyHintBtn">Buy Hint</button>
      <button id="watchAdHintBtn">Watch Ad</button>
      <button id="closeHintBtn">Close</button>
    </div>
  `;
  document.body.appendChild(el);

  const api = {
    show({ coins = 0, freeLeft = 0 } = {}) {
  el.classList.remove("hidden");

  const freeBtn = el.querySelector("#freeHintBtn");
  const buyBtn = el.querySelector("#buyHintBtn");
  const adBtn = el.querySelector("#watchAdHintBtn");
  const balanceEl = el.querySelector("#hintCoinsBalance");

  if (balanceEl) {
    balanceEl.textContent = `Your Coins: ${Number(coins || 0)}`;
  }

  // Free hint button
  if (freeBtn) {
    if (freeLeft > 0) {
      freeBtn.disabled = false;
      freeBtn.textContent = `Free Hint (${freeLeft} left)`;
    } else {
      freeBtn.disabled = true;
      freeBtn.textContent = "No free hints";
    }
  }

  // Buy hint
  if (buyBtn) {
    if (coins < HINT_COST) {
      buyBtn.disabled = true;
      buyBtn.textContent = `Use Hint - ${HINT_COST} Coins`;
    } else {
      buyBtn.disabled = false;
      buyBtn.textContent = `Use Hint - ${HINT_COST} Coins`;
    }
  }

  if (adBtn) {
    adBtn.disabled = false;
    adBtn.textContent = "Watch Ad Instead";
  }
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
