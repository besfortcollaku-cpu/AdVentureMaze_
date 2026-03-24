import "../css/dailyReturnReward.css";

function formatItemLabel(itemType, itemCount) {
  const label = itemType === "hint" ? "Hint" : itemType === "restart" ? "Restart" : "Skip";
  const count = Math.max(0, Number(itemCount || 0));
  return `${count} ${label}${count === 1 ? "" : "s"}`;
}

export function createDailyReturnRewardPopup() {
  const overlay = document.createElement("div");
  overlay.className = "daily-reward-overlay daily-return-reward-overlay hidden";
  overlay.innerHTML = `
    <div class="daily-return-reward-card">
      <div class="daily-return-reward-title">Daily Reward</div>
      <div class="daily-return-reward-streak" id="dailyReturnRewardStreak"></div>
      <div class="daily-return-reward-body" id="dailyReturnRewardBody">You received: 1 Hint</div>
      <div class="daily-return-reward-note hidden" id="dailyReturnRewardNote"></div>
      <button type="button" class="daily-return-reward-ad-btn" id="dailyReturnRewardAdBtn">Watch Ad for +1 more</button>
      <button type="button" class="daily-return-reward-btn" id="dailyReturnRewardContinue">Continue</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const streakEl = overlay.querySelector("#dailyReturnRewardStreak");
  const bodyEl = overlay.querySelector("#dailyReturnRewardBody");
  const noteEl = overlay.querySelector("#dailyReturnRewardNote");
  const adBtn = overlay.querySelector("#dailyReturnRewardAdBtn");
  const continueBtn = overlay.querySelector("#dailyReturnRewardContinue");

  let continueHandler = null;
  let watchAdHandler = null;

  continueBtn?.addEventListener("click", async () => {
    if (continueBtn.disabled) return;
    continueBtn.disabled = true;
    try {
      await continueHandler?.();
    } finally {
      continueBtn.disabled = false;
    }
  });

  adBtn?.addEventListener("click", async () => {
    if (adBtn.disabled) return;
    adBtn.disabled = true;
    try {
      await watchAdHandler?.();
    } finally {
      adBtn.disabled = false;
    }
  });

  return {
    show({ streakDay = 0, itemType = "", itemCount = 0, label = "", canDouble = false, doubled = false } = {}) {
      const rewardLabel = String(label || "").trim() || formatItemLabel(itemType, itemCount);
      if (streakEl) {
        const day = Math.max(0, Number(streakDay || 0));
        streakEl.textContent = day > 0 ? `Day ${day}` : "";
      }
      if (bodyEl) {
        bodyEl.textContent = `You received: ${rewardLabel}`;
      }
      if (noteEl) {
        noteEl.textContent = "";
        noteEl.classList.add("hidden");
      }
      if (adBtn) {
        adBtn.classList.toggle("hidden", !canDouble || doubled);
        adBtn.textContent = `Watch Ad for +${rewardLabel}`;
      }
      overlay.classList.remove("hidden");
    },
    setAdState({ visible = false, disabled = false, text = "" } = {}) {
      if (!adBtn) return;
      adBtn.classList.toggle("hidden", !visible);
      adBtn.disabled = disabled;
      if (text) adBtn.textContent = text;
    },
    setConfirmation(message = "") {
      if (!noteEl) return;
      noteEl.textContent = String(message || "");
      noteEl.classList.toggle("hidden", !message);
    },
    hide() {
      overlay.classList.add("hidden");
    },
    onContinue(fn) {
      continueHandler = fn;
    },
    onWatchAd(fn) {
      watchAdHandler = fn;
    },
  };
}
