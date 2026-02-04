// src/ui/uiWin.js
// Level Complete / Win popup UI

import "../css/win.css";

/* =====================================================
   GLOBAL TOAST (EXPORTED)
===================================================== */
let toastEl = null;

export function showToast(message, duration = 2000) {
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

/* =====================================================
   GLOBAL AD COOLDOWN (EXPORTED)
===================================================== */
const COOLDOWN_KEY = "adCooldownUntil"; // ms timestamp

function setAdCooldown(waitSeconds) {
  const wait = Math.max(0, Number(waitSeconds || 0));
  if (!wait) return;

  setCooldownTotalSec(wait); // needed for progress animation

  const until = Date.now() + wait * 1000;
  setCooldownUntilMs(until);
  startCooldownCountdown();
}

/* =====================================================
   WIN POPUP
===================================================== */
export function createWinPopup() {
  let onNext = null;
  let onWatchAd = null;

  /* ---------------------------
     HTML
  --------------------------- */
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

      <<button class="btn secondary" id="watchAdBtn">
  <span class="adBtnLabel">Watch Ad <span class="reward">+50</span> 🪙</span>
  <span class="adCooldownBar" aria-hidden="true"></span>
</button>

      <div class="tip">
        Tip: Watch ad gives +50 coins
      </div>
    </div>
  `;

  document.body.appendChild(el);

  /* ---------------------------
     Elements
  --------------------------- */
  const levelText = el.querySelector("#winLevelText");
  const nextBtn = el.querySelector("#nextLevelBtn");
  const adBtn = el.querySelector("#watchAdBtn");
const adBtnLabel = adBtn.querySelector(".adBtnLabel");
const adCooldownBar = adBtn.querySelector(".adCooldownBar");
  const adBtnBaseLabel = adBtnLabel ? adBtnLabel.innerHTML : adBtn.innerHTML;

  /* ---------------------------
     Cooldown helpers (PRIVATE)
  --------------------------- */
  let cooldownTimer = null;
function getCooldownTotalSec() {
  const v = Number(localStorage.getItem(COOLDOWN_TOTAL_KEY) || "0");
  return Number.isFinite(v) ? v : 0;
}

function setCooldownTotalSec(sec) {
  localStorage.setItem(COOLDOWN_TOTAL_KEY, String(sec));
}


  function getCooldownUntilMs() {
    const v = Number(localStorage.getItem(COOLDOWN_KEY) || "0");
    return Number.isFinite(v) ? v : 0;
  }

  function clearCooldownTimer() {
    if (cooldownTimer) {
      clearInterval(cooldownTimer);
      cooldownTimer = null;
    }
  }

  function updateAdButtonFromCooldown() {
  const now = Date.now();
  const until = getCooldownUntilMs();
  const total = getCooldownTotalSec();

  if (until > now) {
    const leftMs = until - now;
    const leftSec = Math.ceil(leftMs / 1000);

    adBtn.disabled = true;
    adBtn.classList.add("cooling");

    // label
    if (adBtnLabel) {
      adBtnLabel.textContent = `Wait ${leftSec}s`;
    } else {
      adBtn.textContent = `Wait ${leftSec}s`;
    }

    // progress bar (0 -> 100)
    if (adCooldownBar && total > 0) {
      const done = 1 - Math.min(1, Math.max(0, leftMs / (total * 1000)));
      adCooldownBar.style.transform = `scaleX(${done})`;
    }
  } else {
    adBtn.disabled = false;
    adBtn.classList.remove("cooling");

    if (adBtnLabel) {
      adBtnLabel.innerHTML = adBtnBaseLabel;
    } else {
      adBtn.innerHTML = adBtnBaseLabel;
    }

    if (adCooldownBar) {
      adCooldownBar.style.transform = "scaleX(0)";
    }

    clearCooldownTimer();
  }
}

  function startCooldownCountdown() {
    clearCooldownTimer();
    updateAdButtonFromCooldown();
    cooldownTimer = setInterval(updateAdButtonFromCooldown, 250);
  }

  /* ---------------------------
     Events
  --------------------------- */
  nextBtn.addEventListener("click", () => {
    hide();
    onNext?.();
  });

  adBtn.addEventListener("click", () => {
    const now = Date.now();
    const until = getCooldownUntilMs();

    if (until > now) {
      const leftSec = Math.ceil((until - now) / 1000);
      showToast(`Wait ${leftSec}s before next ad`);
      return;
    }

    onWatchAd?.();
  });

  /* ---------------------------
     API
  --------------------------- */
  function show({ levelNumber }) {
    levelText.textContent = `You finished Level ${levelNumber}`;
    el.classList.remove("hidden");
    startCooldownCountdown();
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
  };
}