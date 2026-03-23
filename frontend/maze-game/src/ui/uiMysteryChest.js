import "../css/mysteryChest.css";

export function createMysteryChestPopup({
  title = "Mystery Chest",
  subtitle = "Perfect 7-day streak!",
  buttonText = "Open Chest",
  requireConfirmAfterReveal = false,
  confirmButtonText = "Continue",
  revealedTitle = "",
  openingText = "Opening...",
} = {}) {
  const overlay = document.createElement("div");
  overlay.className = "daily-reward-overlay hidden";

  overlay.innerHTML = `
    <div class="daily-reward-box chest-box">
      <div class="daily-reward-title">${title}</div>
      <div class="daily-reward-subtitle">${subtitle}</div>

      <div id="chestClosed" class="chest-icon">??</div>

      <div id="chestOpen" class="chest-open hidden">
        <div class="spin">?</div>
        <div id="rewardBadge" class="reward-badge hidden"></div>
        <div id="rewardCoins" class="reward-coins"></div>
      </div>
      <div id="rewardDetail" class="reward-detail hidden"></div>

      <button id="openChest" class="daily-reward-btn">${buttonText}</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const chestClosed = overlay.querySelector("#chestClosed");
  const chestOpen = overlay.querySelector("#chestOpen");
  const rewardBadge = overlay.querySelector("#rewardBadge");
  const rewardCoins = overlay.querySelector("#rewardCoins");
  const rewardDetail = overlay.querySelector("#rewardDetail");
  const btn = overlay.querySelector("#openChest");
  const chestBox = overlay.querySelector(".chest-box");
  const titleEl = overlay.querySelector(".daily-reward-title");
  const subtitleEl = overlay.querySelector(".daily-reward-subtitle");

  let handler = null;
  let revealDoneHandler = null;
  let stage = "ready";

  function formatRewardText(reward) {
    if (reward == null) return "";
    if (typeof reward === "number") return `+${reward} Coins`;
    if (typeof reward === "string") return reward;
    if (typeof reward === "object") {
      if (typeof reward.label === "string" && reward.label.trim()) return reward.label.trim();
      if (reward.rewardType === "coins") return `+${Number(reward.rewardAmount || reward.coins || 0)} Coins`;
      if (reward.rewardType === "restart") return `+${Number(reward.rewardAmount || reward.restartCount || 0)} Restart`;
      if (reward.rewardType === "hint") return `+${Number(reward.rewardAmount || reward.hintCount || 0)} Hint`;
      if (reward.rewardType === "skip") return `+${Number(reward.rewardAmount || reward.skipCount || 0)} Skip`;
    }
    return String(reward);
  }

  function formatRewardBadge(reward) {
    const rewardType = String(reward?.rewardType || "").trim().toLowerCase();
    if (!rewardType) return "";
    if (rewardType === "coins") return "Coins";
    if (rewardType === "restart") return "Restart";
    if (rewardType === "hint") return "Hint";
    if (rewardType === "skip") return "Skip";
    return rewardType;
  }

  btn.onclick = async () => {
    if (stage === "revealed" && requireConfirmAfterReveal) {
      btn.disabled = true;
      overlay.classList.add("hidden");
      revealDoneHandler?.();
      return;
    }

    stage = "opening";
    btn.disabled = true;
    btn.textContent = openingText;
    chestBox.classList.add("priming");
    if (subtitleEl) subtitleEl.textContent = openingText;

    // Luxury anticipation beat before reveal.
    await new Promise((resolve) => setTimeout(resolve, 300));

    chestBox.classList.remove("priming");
    chestBox.classList.add("opening");
    chestBox.classList.add("impact");
    setTimeout(() => chestBox.classList.remove("impact"), 420);

    chestClosed.classList.add("hidden");
    chestOpen.classList.remove("hidden");

    const reward = await handler?.();

    if (reward != null) {
      const rewardBadgeText = formatRewardBadge(reward);
      if (rewardBadge) {
        rewardBadge.textContent = rewardBadgeText;
        rewardBadge.classList.toggle("hidden", !rewardBadgeText);
      }
      rewardCoins.textContent = formatRewardText(reward);
      rewardDetail.textContent = String(reward?.detail || "");
      rewardDetail.classList.toggle("hidden", !reward?.detail);
      chestBox.classList.add("revealed");
      if (requireConfirmAfterReveal) {
        stage = "revealed";
        if (revealedTitle && titleEl) titleEl.textContent = revealedTitle;
        if (subtitleEl) subtitleEl.textContent = String(reward?.subtitle || subtitle);
        btn.textContent = reward?.confirmText || confirmButtonText;
        btn.disabled = false;
      } else {
        setTimeout(() => {
          overlay.classList.add("hidden");
          revealDoneHandler?.();
        }, 3400);
      }
    } else {
      stage = "ready";
      btn.disabled = false;
      btn.textContent = buttonText;
      chestBox.classList.remove("priming");
      chestBox.classList.remove("opening");
      chestBox.classList.remove("revealed");
      chestBox.classList.remove("impact");
      chestClosed.classList.remove("hidden");
      chestOpen.classList.add("hidden");
      if (rewardBadge) {
        rewardBadge.textContent = "";
        rewardBadge.classList.add("hidden");
      }
      rewardDetail.textContent = "";
      rewardDetail.classList.add("hidden");
      if (subtitleEl) subtitleEl.textContent = subtitle;
    }
  };

  return {
    show() {
      stage = "ready";
      chestBox.classList.remove("priming");
      chestBox.classList.remove("opening");
      chestBox.classList.remove("revealed");
      chestBox.classList.remove("impact");
      chestClosed.classList.remove("hidden");
      chestOpen.classList.add("hidden");
      if (rewardBadge) {
        rewardBadge.textContent = "";
        rewardBadge.classList.add("hidden");
      }
      rewardCoins.textContent = "";
      rewardDetail.textContent = "";
      rewardDetail.classList.add("hidden");
      if (titleEl) titleEl.textContent = title;
      if (subtitleEl) subtitleEl.textContent = subtitle;
      btn.textContent = buttonText;
      btn.disabled = false;
      overlay.classList.remove("hidden");
    },

    hide() {
      overlay.classList.add("hidden");
    },

    onOpen(fn) {
      handler = fn;
    },

    onRevealDone(fn) {
      revealDoneHandler = fn;
    },
  };
}
