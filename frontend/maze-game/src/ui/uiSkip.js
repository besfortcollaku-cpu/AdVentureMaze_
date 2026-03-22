import "../css/skip.css";

const SKIP_COST = 40;

export function createSkipPopup() {
  const el = document.createElement("div");
  el.className = "popup hidden";
  el.innerHTML = `
    <div class="popup-card">
      <h3>Skip Level</h3>
      <div class="popup-balance" id="skipCoinsBalance">Your Coins: 0</div>
      <div class="popup-note">Skip Level - ${SKIP_COST} Coins</div>
      <div class="popup-subnote">Skipped levels do not award Score.</div>
      <button id="freeSkipBtn">Free Skip</button>
      <button id="buySkipBtn">Buy Skip</button>
      <button id="watchAdSkipBtn">Watch Ad</button>
      <button id="closeSkipBtn">Close</button>
    </div>
  `;
  document.body.appendChild(el);

  const api = {
    show({ freeLeft = 0, coins = 0 } = {}) {
      el.classList.remove("hidden");

      const freeBtn = el.querySelector("#freeSkipBtn");
      const buyBtn = el.querySelector("#buySkipBtn");
      const adBtn = el.querySelector("#watchAdSkipBtn");
      const balanceEl = el.querySelector("#skipCoinsBalance");

      if (balanceEl) {
        balanceEl.textContent = `Your Coins: ${Number(coins || 0)}`;
      }

      if (freeBtn) {
        if (freeLeft > 0) {
          freeBtn.disabled = false;
          freeBtn.textContent = `Free Skip (${freeLeft} left)`;
        } else {
          freeBtn.disabled = true;
          freeBtn.textContent = "No free skips";
        }
      }

      if (buyBtn) {
        buyBtn.disabled = Number(coins || 0) < SKIP_COST;
        buyBtn.textContent = `Skip Level - ${SKIP_COST} Coins`;
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

    onFreeSkip(cb) {
      el.querySelector("#freeSkipBtn").onclick = cb;
    },
    onBuySkip(cb) {
      el.querySelector("#buySkipBtn").onclick = cb;
    },
    onWatchAdSkip(cb) {
      el.querySelector("#watchAdSkipBtn").onclick = cb;
    },
  };

  el.querySelector("#closeSkipBtn").onclick = () => api.hide();

  return api;
}
