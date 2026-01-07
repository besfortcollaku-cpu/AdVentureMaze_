// src/ui/ui.js

export function mountUI(app) {
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
        <p>This game is designed for smartphones.</p>
      </div>
    </div>

    <div class="loginGate" id="loginGate" aria-hidden="true">
      <div class="loginGateCard">
        <div class="loginGateTitle">Login required</div>
        <div class="loginGateSub">Please login with Pi to start playing.</div>
        <button class="loginGateBtn" id="loginGateBtn">Login with Pi</button>
        <div class="loginGateError" id="loginGateError"></div>
        <div class="loginGateNote">Tip: open inside Pi Browser.</div>
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
  let firstGestureHandler = null;
  let loginHandler = null;
  let winNextHandler = null;
  let winAdHandler = null;
  let soundHandler = null;
  let vibrationHandler = null;

  window.addEventListener("pointerdown", () => {
    firstGestureHandler?.();
    firstGestureHandler = null;
  }, { once: true });

  loginGateBtn.onclick = () => loginHandler?.();
  loginBtn.onclick = () => {
    showLoginGate();
    loginHandler?.();
  };

  settingsBtn.onclick = () => settingsOverlay.classList.add("show");
  settingsCloseBtn.onclick = () => settingsOverlay.classList.remove("show");

  winNextBtn.onclick = () => winNextHandler?.();
  winAdBtn.onclick = () => winAdHandler?.();

  soundToggle.onchange = () => soundHandler?.(soundToggle.checked);
  vibrationToggle.onchange = () => vibrationHandler?.(vibrationToggle.checked);

  // ---------------------------
  // Helpers
  // ---------------------------
  function setCoins(n) {
    coinCountEl.textContent = String(n ?? 0);
  }

  function showLoginGate() {
    loginGate.classList.add("show");
  }

  function hideLoginGate() {
    loginGate.classList.remove("show");
  }

  function showLoginError(msg) {
    loginGateError.textContent = msg || "";
  }

  function showWinPopup({ levelNumber, isLastLevel }) {
    winSubText.textContent = isLastLevel
      ? "You finished the last level!"
      : `You finished Level ${levelNumber}`;
    winOverlay.classList.add("show");
  }

  function hideWinPopup() {
    winOverlay.classList.remove("show");
  }

  // ---------------------------
  // API
  // ---------------------------
  return {
    canvas: document.getElementById("game"),

    setCoins,
    setUser(user) {
      const name = user?.username || "guest";
      userPill.textContent = `User: ${name}`;
      loginBtnText.textContent = name === "guest" ? "Login with Pi" : "Logged in ✅";
    },

    onFirstUserGesture(fn) {
      firstGestureHandler = fn;
    },

    onLoginClick(fn) {
      loginHandler = fn;
    },

    showLoginGate,
    hideLoginGate,
    showLoginError,

    setSoundEnabled(v) {
      soundToggle.checked = !!v;
    },
    setVibrationEnabled(v) {
      vibrationToggle.checked = !!v;
    },
    onSoundToggle(fn) {
      soundHandler = fn;
    },
    onVibrationToggle(fn) {
      vibrationHandler = fn;
    },

    showWinPopup,
    hideWinPopup,
    onWinNext(fn) {
      winNextHandler = fn;
    },
    onWinAd(fn) {
      winAdHandler = fn;
    }
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

/* --- SVGs --- */
function gearSVG() { return `<svg></svg>`; }
function joystickSVG() { return `<svg></svg>`; }