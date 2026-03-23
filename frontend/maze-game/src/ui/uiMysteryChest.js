import "../css/mysteryChest.css";

export function createMysteryChestPopup({
  title = "Mystery Chest",
  subtitle = "Perfect 7-day streak!",
  buttonText = "Open Chest",
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
        <div id="rewardCoins" class="reward-coins"></div>
      </div>

      <button id="openChest" class="daily-reward-btn">${buttonText}</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const chestClosed = overlay.querySelector("#chestClosed");
  const chestOpen = overlay.querySelector("#chestOpen");
  const rewardCoins = overlay.querySelector("#rewardCoins");
  const btn = overlay.querySelector("#openChest");
  const chestBox = overlay.querySelector(".chest-box");

  let handler = null;
  let revealDoneHandler = null;

  function formatRewardText(reward) {
    if (reward == null) return "";
    if (typeof reward === "number") return `+${reward} Coins`;
    if (typeof reward === "string") return reward;
    if (typeof reward === "object") {
      if (typeof reward.label === "string" && reward.label.trim()) return reward.label.trim();
      if (reward.rewardType === "coins") return `You got ${Number(reward.rewardAmount || reward.coins || 0)} Coins`;
      if (reward.rewardType === "restart") return `You got ${Number(reward.rewardAmount || reward.restartCount || 0)} Restart`;
      if (reward.rewardType === "hint") return `You got ${Number(reward.rewardAmount || reward.hintCount || 0)} Hint`;
      if (reward.rewardType === "skip") return `You got ${Number(reward.rewardAmount || reward.skipCount || 0)} Skip`;
    }
    return String(reward);
  }

  btn.onclick = async () => {
    btn.disabled = true;
    chestBox.classList.add("priming");

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
      rewardCoins.textContent = formatRewardText(reward);
      chestBox.classList.add("revealed");
      setTimeout(() => {
        overlay.classList.add("hidden");
        revealDoneHandler?.();
      }, 3400);
    } else {
      btn.disabled = false;
      chestBox.classList.remove("priming");
      chestBox.classList.remove("opening");
      chestBox.classList.remove("revealed");
      chestBox.classList.remove("impact");
      chestClosed.classList.remove("hidden");
      chestOpen.classList.add("hidden");
    }
  };

  return {
    show() {
      chestBox.classList.remove("priming");
      chestBox.classList.remove("opening");
      chestBox.classList.remove("revealed");
      chestBox.classList.remove("impact");
      chestClosed.classList.remove("hidden");
      chestOpen.classList.add("hidden");
      rewardCoins.textContent = "";
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
