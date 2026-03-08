export function createDailyRewardPopup() {
  const el = document.createElement("div");
  el.className = "daily-reward-overlay hidden";

  el.innerHTML = `
    <div class="daily-reward-box">
      <div class="daily-reward-title">Daily Reward</div>
      <div class="daily-reward-subtitle">Come back every day to keep your streak.</div>

      <div id="dailyRewardGrid" class="daily-reward-grid"></div>

    <div class="daily-reward-claim-wrap">

  <div class="daily-reward-coins">
    +<b id="dailyRewardCoins">5</b> coins
  </div>

  <div class="daily-reward-tomorrow">
    Tomorrow: <b id="dailyRewardTomorrow">7</b> coins
  </div>

  <button id="dailyRewardClaimBtn" class="daily-reward-btn">
    Claim
  </button>

</div>
    </div>
  `;

  document.body.appendChild(el);

  const gridEl = el.querySelector("#dailyRewardGrid");
  const coinsEl = el.querySelector("#dailyRewardCoins");
  const tomorrowEl = el.querySelector("#dailyRewardTomorrow");
  const claimBtn = el.querySelector("#dailyRewardClaimBtn");

  let claimHandler = null;

  const REWARDS = [5, 7, 10, 15, 20, 30, 50];

  function renderDays({ activeDay = 1, missedDays = [] } = {}) {
  gridEl.innerHTML = "";

  REWARDS.forEach((coins, i) => {
    const day = i + 1;
    const item = document.createElement("div");
    item.className = "daily-reward-day";

    let status = String(coins);

    if (missedDays.includes(day)) {
      item.classList.add("missed");
      status = "Missed";
    } else if (day < activeDay) {
      item.classList.add("claimed");
      status = "Claimed";
    } else if (day === activeDay) {
      item.classList.add("active");
      status = "Today";
    } else {
      item.classList.add("upcoming");
      status = String(coins);
    }

    item.innerHTML = `
      <div class="daily-reward-day-label">Day ${day}</div>
      <div class="daily-reward-day-coins">${coins}</div>
      <div class="daily-reward-day-status">${status}</div>
    `;

    gridEl.appendChild(item);
  });

  const chest = document.createElement("div");
  chest.className = "daily-reward-day chest-day";

  if (activeDay > 7 && missedDays.length === 0) {
    chest.classList.add("active");
  }

  chest.innerHTML = `
    <div class="daily-reward-day-label">Bonus</div>
    <div class="daily-reward-day-chest">🎁</div>
    <div class="daily-reward-day-status">Bonus</div>
  `;

  gridEl.appendChild(chest);
}
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

show({ day = 1, coins = 5, missedDays = [] } = {}) {

  renderDays({
    activeDay: day,
    missedDays,
  });

  coinsEl.textContent = String(coins);

  const rewards = [5,7,10,15,20,30,50];
  const tomorrowCoins = rewards[Math.min(day, rewards.length - 1)];

  tomorrowEl.textContent = tomorrowCoins;

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