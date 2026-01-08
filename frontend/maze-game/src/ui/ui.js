// src/ui/ui.js

export function mountUI(app) {
  // ---------------------------
  // HTML
  // ---------------------------
  app.innerHTML = `
    <div class="phone">
      <div class="topbar">
        <div class="topRow">
          <div class="brand">
            <div class="logoBox" title="Adventure Maze">
              <img src="/logo.png" alt="Adventure Maze Logo" />
            </div>
          </div>

          <div class="levelWrap">
            <div class="levelNew">NEW!</div>
            <div class="levelText">Adventure Maze</div>
          </div>

          <div class="coins" title="Coins">
            <div class="coinDot"></div>
            <div id="coinCount">0</div>
          </div>
        </div>

        <div class="iconRow">
          ${iconBtn("settingsBtn", gearSVG(), "")}
          ${iconBtn("controls", joystickSVG(), "")}

          <div class="loginWrap">
            <button class="iconBtnWide" id="loginBtn">
              <span id="loginBtnText">Login with Pi</span>
            </button>
            <div class="userPill" id="userPill">User: guest</div>
          </div>
        </div>
      </div>

      <div class="boardWrap">
        <div class="boardFrame">
          <canvas id="game"></canvas>
        </div>
      </div>

      <div class="bottomBar">
        <button class="btn" id="hintBtn">
          <div class="btnIcon">🎬</div>
          <div>HINT</div>
        </button>

        <div class="pill">Swipe to move</div>

        <button class="btn" id="x3Btn">
          <div class="btnIcon">⏩</div>
          <div>×3</div>
        </button>
      </div>
    </div>

    <div class="desktopBlock" id="desktopBlock" style="display:none;">
      <div class="desktopCard">
        <h2>Mobile game</h2>
        <p>This game is designed for smartphones. Desktop is only for testing.</p>
      </div>
    </div>

    <div class="loginGate" id="loginGate" aria-hidden="true">
      <div class="loginGateCard">
        <div class="loginGateTitle">Login required</div>
        <div class="loginGateSub">
          Please login with Pi to start playing.
        </div>

        <button class="loginGateBtn" id="loginGateBtn">
          Login with Pi
        </button>

        <div class="loginGateError" id="loginGateError"></div>

        <div class="loginGateNote">
          Tip: open inside Pi Browser.
        </div>
      </div>
    </div>

    <div class="settingsOverlay" id="settingsOverlay" aria-hidden="true">
      <div class="settingsCard">
        <div class="settingsHeader">
          <div class="settingsTitle">Settings</div>
          <button class="settingsClose" id="settingsCloseBtn">✕</button>
        </div>

        <div class="settingsRow">
          <div class="settingsLeft">
            <div class="settingsLabel">Sound</div>
            <div class="settingsSub">Rolling + victory</div>
          </div>
          <label class="toggle">
            <input type="checkbox" id="soundToggle" />
            <span class="track"></span>
          </label>
        </div>

        <div class="settingsRow">
          <div class="settingsLeft">
            <div class="settingsLabel">Vibration</div>
            <div class="settingsSub">Ball stop vibration</div>
          </div>
          <label class="toggle">
            <input type="checkbox" id="vibrationToggle" />
            <span class="track"></span>
          </label>
        </div>
      </div>
    </div>

    <div class="winOverlay" id="winOverlay" aria-hidden="true">
      <div class="winCard">
        <div class="winHeader">
          <div class="winBadge">CONGRATS!</div>
          <div class="winTitle">Level Complete</div>
          <div class="winSub" id="winSubText"></div>
        </div>

        <div class="winRow">
          <button class="winBtnPrimary" id="winNextBtn">Next level</button>
          <button class="winBtnSecondary" id="winAdBtn">
            Watch Ad <span class="winPlus">+50</span>
          </button>
        </div>
      </div>
    </div>
  `;

  // ---------------------------
  // Elements
  // ---------------------------
  const coinCountEl = document.getElementById("coinCount");
  const loginBtn = document.getElementById("loginBtn");
  const loginBtnText = document.getElementById("loginBtnText");
  const userPill = document.getElementById("userPill");

  const loginGate = document.getElementById("loginGate");
  const loginGateBtn = document.getElementById("loginGateBtn");
  const loginGateError = document.getElementById("loginGateError");

  const settingsBtn = document.getElementById("settingsBtn");
  const settingsOverlay = document.getElementById("settingsOverlay");
  const settingsCloseBtn = document.getElementById("settingsCloseBtn");
  const soundToggle = document.getElementById("soundToggle");
  const vibrationToggle = document.getElementById("vibrationToggle");

  const winOverlay = document.getElementById("winOverlay");
  const winSubText = document.getElementById("winSubText");
  const winNextBtn = document.getElementById("winNextBtn");
  const winAdBtn = document.getElementById("winAdBtn");

  // ---------------------------
  // State
  // ---------------------------
  let soundHandler = null;
  let vibrationHandler = null;
  let winNextHandler = null;
  let winAdHandler = null;
  let loginHandler = null;

  // ---------------------------
  // Helpers
  // ---------------------------
  function setCoins(n) {
    coinCountEl.textContent = String(n ?? 0);
  }

  function showLoginGate() {
    loginGate.classList.add("show");
    loginGateError.textContent = "";
  }

  function hideLoginGate() {
    loginGate.classList.remove("show");
    loginGateError.textContent = "";
  }

  function setUser(user) {
    const name = user?.username || "guest";
    userPill.textContent = `User: ${name}`;
    loginBtnText.textContent =
      name === "guest" ? "Login with Pi" : "Logged in ✅";
  }

  // ---------------------------
  // Events
  // ---------------------------
  loginGateBtn.addEventListener("click", async () => {
    if (loginHandler) await loginHandler();
  });

  loginBtn.addEventListener("click", () => {
    showLoginGate();
  });

  settingsBtn.addEventListener("click", () =>
    settingsOverlay.classList.add("show")
  );

  settingsCloseBtn.addEventListener("click", () =>
    settingsOverlay.classList.remove("show")
  );

  soundToggle.addEventListener("change", () =>
    soundHandler?.(soundToggle.checked)
  );

  vibrationToggle.addEventListener("change", () =>
    vibrationHandler?.(vibrationToggle.checked)
  );

  winNextBtn.addEventListener("click", () => winNextHandler?.());
  winAdBtn.addEventListener("click", () => winAdHandler?.());

  // ---------------------------
  // API
  // ---------------------------
  return {
    canvas: document.getElementById("game"),

    setCoins,
    setUser,

    showLoginGate,
    hideLoginGate,
    showLoginError(msg) {
      loginGateError.textContent = msg || "";
    },

    onLoginClick(fn) {
      loginHandler = fn;
    },

    onSoundToggle(fn) {
      soundHandler = fn;
    },

    onVibrationToggle(fn) {
      vibrationHandler = fn;
    },

    showWinPopup({ levelNumber, isLastLevel }) {
      winSubText.textContent = isLastLevel
        ? "You finished the last level!"
        : `You finished Level ${levelNumber}`;
      winNextBtn.textContent = isLastLevel ? "Restart" : "Next level";
      winOverlay.classList.add("show");
    },

    hideWinPopup() {
      winOverlay.classList.remove("show");
    },

    onWinNext(fn) {
      winNextHandler = fn;
    },

    onWinAd(fn) {
      winAdHandler = fn;
    },
  };
}

/* ---------------- UI helpers ---------------- */
function iconBtn(id, svg, badgeText) {
  return `
    <button class="iconBtn" id="${id}">
      ${badgeText ? `<div class="badgeNew">${badgeText}</div>` : ""}
      ${svg}
    </button>
  `;
}

/* --- SVGs (UNCHANGED) --- */
/* --- SVG functions --- */

function gearSVG() {
  return `
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4" />
    </svg>
  `;
}

function joystickSVG() {
  return `
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M9 8.5c0-1.7 1.3-3 3-3" />
    </svg>
  `;
}

function brushSVG() {
  return `
    <svg viewBox="0 0 24 24" fill="none"></svg>
  `;
}

function trophySVG() {
  return `
    <svg viewBox="0 0 24 24" fill="none"></svg>
  `;
}

function noAdsSVG() {
  return `
    <svg viewBox="0 0 24 24" fill="none"></svg>
  `;
}