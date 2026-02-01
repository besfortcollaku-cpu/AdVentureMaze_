// src/ui/uiWin.js
// Level Complete / Win popup UI
import "../css/win.css";
export function createWinPopup() {
  let onNext = null;
  let onWatchAd = null;

  // ---------------------------
  // HTML
  // ---------------------------
  const el = document.createElement("div");
  el.className = "overlay winOverlay hidden";

  el.innerHTML = `
    <div class="modal winModal">
      <div class="badge">CONGRATS!</div>

      <h2 class="title">Level Complete</h2>
      <div class="subtitle" id="winLevelText">You finished Level</div>

      <div class="victoryBox">
        <span class="icon">♪</span>
        <span>Victory vibes</span>
      </div>

      <button class="btn primary" id="nextLevelBtn">
        Next level
      </button>

      <button class="btn secondary" id="watchAdBtn">
        Watch Ad <span class="reward">+50</span> 🪙
      </button>

      <div class="tip">
        Tip: Watch ad gives +50 coins
      </div>
    </div>
  `;

  document.body.appendChild(el);

  // ---------------------------
  // Elements
  // ---------------------------
  const levelText = el.querySelector("#winLevelText");
  const nextBtn = el.querySelector("#nextLevelBtn");
  const adBtn = el.querySelector("#watchAdBtn");
  setAdButton(adBtn);

  // ---------------------------
  // Events
  // ---------------------------
  nextBtn.addEventListener("click", () => {
    hide();
    onNext?.();
  });

  adBtn.addEventListener("click", () => {
    onWatchAd?.();
  });

  // ---------------------------
  // API
  // ---------------------------
  let toastEl;
let adBtn;
let adBtnLabel = "Watch Ad +50";

function showToast(message, duration = 2000) {
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.id = "game-toast";
    document.body.appendChild(toastEl);
  }

  toastEl.textContent = message;
  toastEl.classList.add("show");

  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => {
    toastEl.classList.remove("show");
  }, duration);
}

function setAdButton(el) {
  adBtn = el;
  adBtnLabel = el.textContent;
}

function setAdCooldown(seconds) {
  if (!adBtn) return;

  adBtn.disabled = true;
  let remaining = seconds;
  adBtn.textContent = `Next ad in ${remaining}s`;

  clearInterval(adBtn._cd);
  adBtn._cd = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(adBtn._cd);
      adBtn.disabled = false;
      adBtn.textContent = adBtnLabel;
    } else {
      adBtn.textContent = `Next ad in ${remaining}s`;
    }
  }, 1000);
}
  
  let adBtn;
let adBtnLabel = "Watch Ad +50";

export function setAdButton(el) {
  adBtn = el;
  adBtnLabel = el.textContent;
}

export function setAdCooldown(seconds) {
  if (!adBtn) return;

  adBtn.disabled = true;

  let remaining = seconds;
  adBtn.textContent = `Next ad in ${remaining}s`;

  clearInterval(adBtn._cd);
  adBtn._cd = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(adBtn._cd);
      adBtn.disabled = false;
      adBtn.textContent = adBtnLabel;
    } else {
      adBtn.textContent = `Next ad in ${remaining}s`;
    }
  }, 1000);
}
  function show({ levelNumber }) {    levelText.textContent = `You finished Level ${levelNumber}`;
    el.classList.remove("hidden");
  }

  function hide() {
    el.classList.add("hidden");
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
  onNextLevel,
  onWatchAdClick,
  showToast,
  setAdCooldown,
  };
}