// src/ui/uiWin.js
// Level Complete / Win popup UI
import "../css/win.css";
import { getTheme } from "../theme.js";

export function createWinPopup() {
  let onNext = null;
  let onWatchAd = null;

  const el = document.createElement("div");
  el.className = "overlay winOverlay hidden";

  el.innerHTML = `
    <div class="modal winModal">
      <div id="congratsBadge" class="badge">
  CONGRATS!
</div>
      <h2 class="title">Level Complete</h2>
      <div class="subtitle" id="winLevelText">You finished Level</div>

      <div class="winRewardSummary" id="winRewardSummary">
        <div class="winRewardRow">
          <span class="winRewardLabel">Coins</span>
          <span class="winRewardValue" id="winRewardCoins">+0</span>
        </div>
        <div class="winRewardRow">
          <span class="winRewardLabel">Score</span>
          <span class="winRewardValue" id="winRewardScore">+0</span>
        </div>
      </div>

      <div class="winRewardStatus hidden" id="winRewardStatus"></div>
      <div class="winRewardNote hidden" id="winRewardNote"></div>

<div class="winCard">
      <button class="btn primary btnNext" id="nextLevelBtn">
        Next level
      </button>
</div>

      <button class="btn secondary" id="watchAdBtn">
        Watch Ad for Surprise Box
      </button>

      <div class="tip">
        Tip: Watch an ad to open a surprise box
      </div>
        </div>
    </div>
  `;

  document.body.appendChild(el);

  const levelText = el.querySelector("#winLevelText");
  const rewardSummaryEl = el.querySelector("#winRewardSummary");
  const rewardCoinsEl = el.querySelector("#winRewardCoins");
  const rewardScoreEl = el.querySelector("#winRewardScore");
  const rewardStatusEl = el.querySelector("#winRewardStatus");
  const rewardNoteEl = el.querySelector("#winRewardNote");
  const nextBtn = el.querySelector("#nextLevelBtn");
  const adBtn = el.querySelector("#watchAdBtn");
  const adBtnDefaultText = adBtn?.textContent || "Watch Ad for Surprise Box";

  nextBtn.addEventListener("click", () => {
    hide();
    onNext?.();
  });

  adBtn.addEventListener("click", () => {
    onWatchAd?.();
  });

  function applyRewardSummary({
    rewards = null,
    rewardStatus = "",
    rewardNote = "",
  } = {}) {
    const hasRewards = rewards && (rewards.mc != null || rewards.rp != null);
    const mc = Number(rewards?.mc || 0);
    const rp = Number(rewards?.rp || 0);

    if (rewardSummaryEl) rewardSummaryEl.classList.toggle("hidden", !hasRewards);
    if (rewardCoinsEl) rewardCoinsEl.textContent = `+${mc}`;
    if (rewardScoreEl) rewardScoreEl.textContent = `+${rp}`;

    if (rewardStatusEl) {
      rewardStatusEl.textContent = hasRewards ? rewardStatus || "" : "";
      rewardStatusEl.classList.toggle("hidden", !hasRewards || !rewardStatus);
    }

    if (rewardNoteEl) {
      rewardNoteEl.textContent = hasRewards ? rewardNote || "" : "";
      rewardNoteEl.classList.toggle("hidden", !hasRewards || !rewardNote);
    }
  }

  function show({ levelNumber, rewards = null, rewardStatus = "", rewardNote = "" }) {
    const theme = getTheme();

    el.classList.remove("theme-forest", "theme-lava", "theme-ice");
    el.classList.add(`theme-${theme}`);

    levelText.textContent = `You finished Level ${levelNumber}`;
    applyRewardSummary({ rewards, rewardStatus, rewardNote });
    setWatchAdBusy(false);
    el.classList.remove("hidden");
  }

  function hide() {
    setWatchAdBusy(false);
    el.classList.add("hidden");
  }

  function setWatchAdBusy(isBusy, busyText = "Please wait...") {
    if (!adBtn) return;
    adBtn.disabled = !!isBusy;
    adBtn.textContent = isBusy ? busyText : adBtnDefaultText;
  }

  function onNextLevel(cb) {
    onNext = cb;
  }

  function onWatchAdClick(cb) {
    onWatchAd = cb;
  }

  return {
    show,
    hide,
    setRewardSummary: applyRewardSummary,
    setWatchAdBusy,
    onNextLevel,
    onWatchAdClick,
  };
}
