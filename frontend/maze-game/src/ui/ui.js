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
          <button class="winBtnSecondary" id="winAdBtn">Watch Ad</button>
        </div>
      </div>
    </div>

    <div class="levelSelectOverlay" id="levelSelectOverlay" aria-hidden="true">
      <div class="winCard">
        <div class="winHeader">
          <div class="winBadge">LEVELS</div>
          <div class="winTitle">Select Level</div>
        </div>
        <div class="levelGrid" id="levelGrid"></div>
        <div class="winRow">
          <button class="winBtnSecondary" id="levelSelectClose">Close</button>
        </div>
      </div>
    </div>

    <!-- 🆕 WELCOME OVERLAY -->
    <div class="welcomeOverlay" id="welcomeOverlay" aria-hidden="true">
      <div class="welcomeCard">
        <h2 class="welcomeTitle">Welcome to Adventure Maze</h2>
        <p class="welcomeText">
          Tilt, think, and escape the maze.<br />
          Complete levels, earn coins, and challenge yourself.
        </p>
        <button class="welcomeStartBtn" id="welcomeStartBtn">
          Start Playing
        </button>
      </div>
    </div>
  `;

  // ---------------------------
  // Elements
  // ---------------------------
  const coinCount = document.getElementById("coinCount");
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

  const levelSelectOverlay = document.getElementById("levelSelectOverlay");
  const levelGrid = document.getElementById("levelGrid");
  const levelSelectClose = document.getElementById("levelSelectClose");

  // 🆕 Welcome elements
  const welcomeOverlay = document.getElementById("welcomeOverlay");
  const welcomeStartBtn = document.getElementById("welcomeStartBtn");

  // ---------------------------
  // State
  // ---------------------------
  let soundHandler = null;
  let vibrationHandler = null;
  let winNextHandler = null;
  let winAdHandler = null;
  let levelSelectHandler = null;
  let welcomeStartHandler = null;

  // ---------------------------
  // Welcome API
  // ---------------------------
  function showWelcome() {
    if (!welcomeOverlay) return;
    welcomeOverlay.classList.add("show");
    welcomeOverlay.setAttribute("aria-hidden", "false");
  }

  function hideWelcome() {
    if (!welcomeOverlay) return;
    welcomeOverlay.classList.remove("show");
    welcomeOverlay.setAttribute("aria-hidden", "true");
  }

  function onWelcomeStart(fn) {
    welcomeStartHandler = fn;
  }

  welcomeStartBtn?.addEventListener("click", () => {
    welcomeStartHandler?.();
  });

  // ---------------------------
  // Helpers
  // ---------------------------
  function setCoins(n) {
    if (coinCount) coinCount.textContent = String(n ?? 0);
  }

  function setUser(user) {
    const name = user?.username || "guest";
    if (userPill) userPill.textContent = `User: ${name}`;
    if (loginBtnText)
      loginBtnText.textContent =
        name === "guest" ? "Login with Pi" : "Logged in ✅";
  }

  // ---------------------------
  // Public API
  // ---------------------------
  return {
    canvas: document.getElementById("game"),

    setCoins,
    setUser,

    loginBtn,
    loginBtnText,
    userPill,

    showLoginGate() {
      loginGate?.classList.add("show");
    },
    hideLoginGate() {
      loginGate?.classList.remove("show");
    },
    showLoginError(msg) {
      if (loginGateError) loginGateError.textContent = msg || "";
    },
    onLoginClick(fn) {
      loginGateBtn?.addEventListener("click", fn);
    },

    setSoundEnabled(v) {
      if (soundToggle) soundToggle.checked = !!v;
    },
    setVibrationEnabled(v) {
      if (vibrationToggle) vibrationToggle.checked = !!v;
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
    },

    showLevelSelect,
    hideLevelSelect,
    onLevelSelect(fn) {
      levelSelectHandler = fn;
    },

    // 🆕 Welcome API
    showWelcome,
    hideWelcome,
    onWelcomeStart,
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

/* SVG helpers unchanged */
function gearSVG() {}
function joystickSVG() {}
function brushSVG() {}
function trophySVG() {}
function noAdsSVG() {}