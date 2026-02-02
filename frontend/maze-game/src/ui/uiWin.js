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

export function setAdCooldown(waitSeconds) {
  const wait = Math.max(0, Number(waitSeconds || 0));
  if (!wait) return;

  const until = Date.now() + wait * 1000;
  localStorage.setItem(COOLDOWN_KEY, String(until));
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

      <button class="btn secondary" id="watchAdBtn">
        Watch Ad <span class="reward">+50</span> 🪙
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

  const adBtnBaseLabel = adBtn.textContent;

  /* ---------------------------
     Cooldown helpers (PRIVATE)
  --------------------------- */
  let cooldownTimer = null;

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

    if (until > now) {
      const leftSec = Math.ceil((until - now) / 1000);
      adBtn.disabled = true;
      adBtn.textContent = `Wait ${leftSec}s`;
    } else {
      adBtn.disabled = false;
      adBtn.textContent = adBtnBaseLabel;
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