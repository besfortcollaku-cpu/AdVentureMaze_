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
  `;

  // ---------------------------
  // DOM Elements
  // ---------------------------
  const el = {
    coinCount: document.getElementById("coinCount"),

    loginBtn: document.getElementById("loginBtn"),
    loginBtnText: document.getElementById("loginBtnText"),
    userPill: document.getElementById("userPill"),

    loginGate: document.getElementById("loginGate"),
    loginGateBtn: document.getElementById("loginGateBtn"),
    loginGateError: document.getElementById("loginGateError"),

    settingsBtn: document.getElementById("settingsBtn"),
    settingsOverlay: document.getElementById("settingsOverlay"),
    settingsCloseBtn: document.getElementById("settingsCloseBtn"),
    soundToggle: document.getElementById("soundToggle"),
    vibrationToggle: document.getElementById("vibrationToggle"),

    winOverlay: document.getElementById("winOverlay"),
    winSubText: document.getElementById("winSubText"),
    winNextBtn: document.getElementById("winNextBtn"),
    winAdBtn: document.getElementById("winAdBtn"),

    levelSelectOverlay: document.getElementById("levelSelectOverlay"),
    levelGrid: document.getElementById("levelGrid"),
    levelSelectClose: document.getElementById("levelSelectClose"),
  };

  // ---------------------------
  // State
  // ---------------------------
  let soundHandler = null;
  let vibrationHandler = null;
  let winNextHandler = null;
  let winAdHandler = null;
  let levelSelectHandler = null;
  let firstGestureHandler = null;

  function setCoins(n) {
    if (el.coinCount) el.coinCount.textContent = String(n ?? 0);
  }

  function showLoginGate() {
    el.loginGate?.classList.add("show");
  }

  function hideLoginGate() {
    el.loginGate?.classList.remove("show");
  }

  function showLoginError(msg) {
    if (el.loginGateError) el.loginGateError.textContent = msg || "";
  }

  function onLoginClick(fn) {
    el.loginGateBtn?.addEventListener("click", fn);
  }

  function setUser(user) {
    const name = user?.username || "guest";
    if (el.userPill) el.userPill.textContent = `User: ${name}`;
    if (el.loginBtnText)
      el.loginBtnText.textContent = name === "guest" ? "Login with Pi" : "Logged in ✅";
  }

  function showWinPopup({ levelNumber, isLastLevel } = {}) {
    if (el.winSubText) {
      el.winSubText.textContent = isLastLevel
        ? "You finished the last level!"
        : `You finished Level ${levelNumber}`;
    }
    el.winOverlay?.classList.add("show");
  }

  function hideWinPopup() {
    el.winOverlay?.classList.remove("show");
  }

  function showLevelSelect({ totalLevels, isCompleted, currentLevel }) {
    if (!el.levelGrid) return;
    el.levelGrid.innerHTML = "";

    for (let i = 1; i <= totalLevels; i++) {
      const btn = document.createElement("button");
      const completed = isCompleted?.(i);
      btn.className =
        "levelBtn" +
        (completed ? "" : " locked") +
        (i === currentLevel ? " current" : "");
      btn.textContent = completed ? `✔ Level ${i}` : `🔒 ${i}`;
      if (completed) {
        btn.onclick = () => {
          hideLevelSelect();
          levelSelectHandler?.(i - 1);
        };
      }
      el.levelGrid.appendChild(btn);
    }

    el.levelSelectOverlay?.classList.add("show");
  }

  function hideLevelSelect() {
    el.levelSelectOverlay?.classList.remove("show");
  }

  el.levelSelectClose?.addEventListener("click", hideLevelSelect);

  return {
    canvas: document.getElementById("game"),
    setCoins,

    loginBtn: el.loginBtn,
    loginBtnText: el.loginBtnText,
    userPill: el.userPill,

    showLoginGate,
    hideLoginGate,
    showLoginError,
    onLoginClick,
    setUser,

    showWinPopup,
    hideWinPopup,
    onWinNext(fn) { winNextHandler = fn; },
    onWinAd(fn) { winAdHandler = fn; },

    showLevelSelect,
    hideLevelSelect,
    onLevelSelect(fn) { levelSelectHandler = fn; },

    onSoundToggle(fn) { soundHandler = fn; },
    onVibrationToggle(fn) { vibrationHandler = fn; },
    onFirstUserGesture(fn) { firstGestureHandler = fn; },
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

/* SVG helpers unchanged below */
function gearSVG() { /* unchanged */ }
function joystickSVG() { /* unchanged */ }
function brushSVG() { /* unchanged */ }
function trophySVG() { /* unchanged */ }
function noAdsSVG() { /* unchanged */ }