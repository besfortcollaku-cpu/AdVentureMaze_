import "../css/mysteryChest.css";

export function createMysteryChestPopup() {
  const overlay = document.createElement("div");
  overlay.className = "daily-reward-overlay hidden";

  overlay.innerHTML = `
    <div class="daily-reward-box chest-box">
      <div class="daily-reward-title">Mystery Chest</div>
      <div class="daily-reward-subtitle">Perfect 7-day streak!</div>

      <div id="chestClosed" class="chest-icon">🎁</div>

      <div id="chestOpen" class="chest-open hidden">
        <div class="spin">✨</div>
        <div id="rewardCoins" class="reward-coins"></div>
      </div>

      <button id="openChest" class="daily-reward-btn">Open Chest</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const chestClosed = overlay.querySelector("#chestClosed");
  const chestOpen = overlay.querySelector("#chestOpen");
  const rewardCoins = overlay.querySelector("#rewardCoins");
  const btn = overlay.querySelector("#openChest");
  const chestBox = overlay.querySelector(".chest-box");

  let handler = null;

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
      rewardCoins.textContent = `+${reward} coins`;
      chestBox.classList.add("revealed");
      setTimeout(() => {
        overlay.classList.add("hidden");
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
  };
}
