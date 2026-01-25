// src/ui/ui.js
export function mountUI(app) {
  app.innerHTML = `
    <div class="phone">
      <!-- TOP -->
      <div class="topbar">
        <div class="levelText" id="levelText">Level 1</div>

        <div class="topRow">
          <div class="iconRow">
            ${iconBtn("accountBtn", userAccountSVG())}
            ${iconBtn("settingsBtn", gearSVG())}
            ${iconBtn("controls", joystickSVG())}
          </div>

          <div class="coins" title="Coins">
            <div class="coinDot"></div>
            <div id="coinCount">0</div>
          </div>
        </div>
      </div>

      <!-- BOARD -->
      <div class="boardWrap">
        <div class="boardFrame">
          <canvas id="game"></canvas>
        </div>
      </div>

<!-- BOTTOM -->
<div class="bottomBar">
  <div class="bottomBtns">
    <button id="hintBtn" class="bottomBtn left">
      <span class="icon">❓</span><span>Hint</span>
    </button>

    <div class="swipeHint">Swipe to move</div>

    <button id="x3Btn" class="bottomBtn right">
      <span class="icon">⏭</span><span>Skip</span>
    </button>
  </div>
</div>

<!-- AD (always bottom) -->
<div class="adBanner" id="adBanner">Ad Banner</div>
  `;


const canvas = document.getElementById("game");
const rect = canvas.parentElement.getBoundingClientRect();

canvas.width = rect.width;
canvas.height = rect.height;
  // Elements
  const levelTextEl = document.getElementById("levelText");
  const coinCountEl = document.getElementById("coinCount");

  const hintBtn = document.getElementById("hintBtn");
  const skipBtn = document.getElementById("x3Btn");
  const settingsBtn = document.getElementById("settingsBtn");
  const controlsBtn = document.getElementById("controls");
  const accountBtn = document.getElementById("accountBtn");

  // Handlers (we’ll wire real logic later)
  let hintHandler = null;
  let skipHandler = null;
  let settingsHandler = null;
  let levelsHandler = null;
  let accountHandler = null;

  hintBtn?.addEventListener("click", () => hintHandler?.());
  skipBtn?.addEventListener("click", () => skipHandler?.());
  settingsBtn?.addEventListener("click", () => settingsHandler?.());
  controlsBtn?.addEventListener("click", () => levelsHandler?.());
  accountBtn?.addEventListener("click", () => accountHandler?.());

  function setLevel(n) {
    if (!levelTextEl) return;
    levelTextEl.textContent = `Level ${n}`;
  }

  function setCoins(n) {
    if (!coinCountEl) return;
    coinCountEl.textContent = String(n ?? 0);
  }

  return {
    canvas,
    setLevel,
    setCoins,

    onHint(fn) {
      hintHandler = fn;
    },
    onSkip(fn) {
      skipHandler = fn;
    },
    onSettings(fn) {
      settingsHandler = fn;
    },
    onLevels(fn) {
      levelsHandler = fn;
    },
    onAccount(fn) {
      accountHandler = fn;
    },
  };
}

function iconBtn(id, svg) {
  return `
    <button class="iconBtn" id="${id}" type="button">
      ${svg}
    </button>
  `;
}

/* --- SVGs --- */
function userAccountSVG() {
  return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9 8.5c0-1.9 1.6-3.5 3-3.5s3 1.6 3 3.5-1.6 3.3-3 3.3-3-1.4-3-3.3Z"
      stroke="rgba(234,243,255,.9)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M5.5 19c0-3.1 2.5-5.6 5.6-5.6h1.8c3.1 0 5.6 2.5 5.6 5.6"
      stroke="rgba(234,243,255,.75)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 14.6h4"
      stroke="rgba(37,215,255,.95)" stroke-width="2.2" stroke-linecap="round"/>
  </svg>`;
}

function gearSVG() {
  return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
      stroke="rgba(234,243,255,.95)" stroke-width="1.8"/>
    <path d="M19 13.2v-2.4l-2.1-.5a7.5 7.5 0 0 0-.6-1.4l1.2-1.8-1.7-1.7-1.8 1.2c-.5-.25-1-.45-1.5-.6L12.8 3h-2.4l-.5 2.1c-.5.15-1 .35-1.4.6L6.7 4.5 5 6.2l1.2 1.8c-.25.45-.45.95-.6 1.45L3.5 10.8v2.4l2.1.5c.15.5.35 1 .6 1.4L5 16.9l1.7 1.7 1.8-1.2c.45.25.95.45 1.45.6l.5 2.1h2.4l.5-2.1c.5-.15 1-.35 1.4-.6l1.8 1.2 1.7-1.7-1.2-1.8c.25-.45.45-.95.6-1.45L19 13.2Z"
      stroke="rgba(234,243,255,.75)" stroke-width="1.6" stroke-linejoin="round"/>
  </svg>`;
}

function joystickSVG() {
  return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 18h16" stroke="rgba(234,243,255,.75)" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M4 18h6" stroke="rgba(37,215,255,.95)" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M6 13h12" stroke="rgba(234,243,255,.75)" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M6 13h5" stroke="rgba(37,215,255,.95)" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M8 8h8" stroke="rgba(234,243,255,.75)" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M8 8h4" stroke="rgba(37,215,255,.95)" stroke-width="2.2" stroke-linecap="round"/>
  </svg>`;
}