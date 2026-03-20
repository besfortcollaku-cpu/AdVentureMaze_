import "../css/dailyRankingReward.css";

function toDateLabel(dateKey) {
  const raw = String(dateKey || "").trim();
  if (!raw) return "";
  const d = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString([], { year: "numeric", month: "short", day: "2-digit" });
}

export function createDailyRankingRewardPopup() {
  const overlay = document.createElement("div");
  overlay.className = "daily-ranking-reward-overlay hidden";
  overlay.innerHTML = `
    <div class="daily-ranking-reward-card">
      <div class="daily-ranking-reward-title">Daily Ranking Reward</div>
      <div class="daily-ranking-reward-sub" id="dailyRankingRewardSub">You finished #1 yesterday.</div>
      <div class="daily-ranking-reward-date" id="dailyRankingRewardDate"></div>
      <div class="daily-ranking-reward-coins" id="dailyRankingRewardCoins">+0 coins</div>
      <button type="button" class="daily-ranking-reward-btn" id="dailyRankingRewardClaim">Claim</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const subEl = overlay.querySelector("#dailyRankingRewardSub");
  const dateEl = overlay.querySelector("#dailyRankingRewardDate");
  const coinsEl = overlay.querySelector("#dailyRankingRewardCoins");
  const claimBtn = overlay.querySelector("#dailyRankingRewardClaim");

  let claimHandler = null;

  claimBtn?.addEventListener("click", async () => {
    if (claimBtn.disabled) return;
    claimBtn.disabled = true;
    try {
      await claimHandler?.();
    } finally {
      claimBtn.disabled = false;
    }
  });

  return {
    show({ rank, rewardCoins, dateKey } = {}) {
      const rankNum = Number(rank || 0);
      const coinsNum = Number(rewardCoins || 0);
      if (subEl) subEl.textContent = `You finished #${rankNum} yesterday.`;
      if (coinsEl) coinsEl.textContent = `+${coinsNum} coins`;
      if (dateEl) {
        const label = toDateLabel(dateKey);
        dateEl.textContent = label ? `Result Date: ${label}` : "";
      }
      overlay.classList.remove("hidden");
    },
    hide() {
      overlay.classList.add("hidden");
    },
    onClaim(fn) {
      claimHandler = fn;
    },
  };
}
