export function createMissedRewardPopup() {
  const overlay = document.createElement("div");
  overlay.className = "daily-reward-overlay hidden";

  overlay.innerHTML = `
    <div class="daily-reward-box">
      <div class="daily-reward-title">Missed Reward</div>
      <div class="daily-reward-subtitle">You can recover one missed day by watching an ad.</div>

      <div class="daily-reward-coins">
        Day <b id="missedRewardDay">2</b>
      </div>

      <div class="daily-reward-tomorrow">
        Reward: <b id="missedRewardCoins">7</b> coins
      </div>

      <button id="missedRecoverBtn" class="daily-reward-btn">
        Recover via Ad
      </button>

      <button id="missedIgnoreBtn" class="daily-reward-btn" style="margin-top:10px; opacity:.85;">
        Ignore
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  const dayEl = overlay.querySelector("#missedRewardDay");
  const coinsEl = overlay.querySelector("#missedRewardCoins");
  const recoverBtn = overlay.querySelector("#missedRecoverBtn");
  const ignoreBtn = overlay.querySelector("#missedIgnoreBtn");

  let recoverHandler = null;
  let ignoreHandler = null;

  recoverBtn.addEventListener("click", () => {
    recoverHandler?.();
  });

  ignoreBtn.addEventListener("click", () => {
    ignoreHandler?.();
  });

  return {
    show({ day, coins }) {
      dayEl.textContent = String(day);
      coinsEl.textContent = String(coins);
      overlay.classList.remove("hidden");
    },

    hide() {
      overlay.classList.add("hidden");
    },

    onRecover(fn) {
      recoverHandler = fn;
    },

    onIgnore(fn) {
      ignoreHandler = fn;
    },
  };
}