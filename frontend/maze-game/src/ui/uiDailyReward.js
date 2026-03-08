export function createDailyRewardPopup() {
  const el = document.createElement("div");
  el.className = "daily-reward-overlay hidden";

  el.innerHTML = `
    <div class="daily-reward-box">
      <div class="daily-reward-title">Daily Reward</div>
      <div class="daily-reward-subtitle">Come back every day to keep your streak.</div>

      <div class="daily-reward-streak">
        <span>Day</span>
        <b id="dailyRewardDay">1</b>
      </div>

      <div class="daily-reward-coins">
        +<b id="dailyRewardCoins">5</b> coins
      </div>

      <button id="dailyRewardClaimBtn" class="daily-reward-btn">
        Claim
      </button>
    </div>
  `;

  document.body.appendChild(el);

  const dayEl = el.querySelector("#dailyRewardDay");
  const coinsEl = el.querySelector("#dailyRewardCoins");
  const claimBtn = el.querySelector("#dailyRewardClaimBtn");

  let claimHandler = null;

  claimBtn.addEventListener("click", async () => {
    if (claimBtn.disabled) return;
    claimBtn.disabled = true;
    try {
      await claimHandler?.();
    } finally {
      claimBtn.disabled = false;
    }
  });

  return {
    show({ day = 1, coins = 5 } = {}) {
      dayEl.textContent = String(day);
      coinsEl.textContent = String(coins);
      el.classList.remove("hidden");
    },

    hide() {
      el.classList.add("hidden");
    },

    onClaim(fn) {
      claimHandler = fn;
    },
  };
}