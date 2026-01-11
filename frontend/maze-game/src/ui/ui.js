// src/ui/ui.js

export function mountUI(app) {
  // ---------------------------
  // Base HTML
  // ---------------------------
  app.innerHTML = `
    <div class="phone game-hidden">
      <div class="topbar">
        <div class="topRow">
          <div class="brand">
            <div class="logoBox">
              <img src="/logo.png" alt="Adventure Maze" />
            </div>
          </div>

          <div class="levelWrap">
            <div class="levelText">Adventure Maze</div>
          </div>

          <div class="coins">
            <div class="coinDot"></div>
            <div id="coinCount">0</div>
          </div>
        </div>

        <div class="iconRow">
          ${iconBtn("settingsBtn", gearSVG())}
          ${iconBtn("controls", joystickSVG())}

          <div class="loginWrap">
            <button id="loginBtn" class="iconBtnWide">
              <span id="loginBtnText">Login with Pi</span>
            </button>
            <div id="userPill" class="userPill">User: guest</div>
          </div>
        </div>
      </div>

      <div class="boardWrap">
        <canvas id="game"></canvas>
      </div>

      <div class="bottomBar">
        <button class="btn" id="hintBtn">💡 HINT</button>
        <div class="pill">Swipe to move</div>
        <button class="btn" id="x3Btn">⏩ ×3</button>
      </div>
    </div>

    <!-- WELCOME -->
    <div class="welcomeOverlay" id="welcomeOverlay">
      <div class="welcomeCard">
        <h2 id="welcomeTitle"></h2>
        <p id="welcomeText"></p>
        <button id="welcomeStartBtn" class="welcomeBtn">Start Playing</button>
      </div>
    </div>

    <!-- LEVEL SELECT -->
    <div class="levelSelectOverlay" id="levelSelectOverlay">
      <div class="winCard">
        <h2>Select Level</h2>
        <div id="levelGrid" class="levelGrid"></div>
        <button id="levelSelectClose" class="winBtnSecondary">Close</button>
      </div>
    </div>

    <!-- WIN -->
    <div class="winOverlay" id="winOverlay">
      <div class="winCard">
        <div id="winSubText"></div>
        <button id="winNextBtn" class="winBtnPrimary">Next</button>
        <button id="winAdBtn" class="winBtnSecondary">Watch Ad +50</button>
      </div>
    </div>
  `;

  const root = app.querySelector(".phone");

  // ---------------------------
  // Elements
  // ---------------------------
  const coinCountEl = $("#coinCount");
  const welcomeOverlay = $("#welcomeOverlay");
  const welcomeTitle = $("#welcomeTitle");
  const welcomeText = $("#welcomeText");
  const welcomeStartBtn = $("#welcomeStartBtn");

  const levelSelectOverlay = $("#levelSelectOverlay");
  const levelGrid = $("#levelGrid");
  const levelSelectClose = $("#levelSelectClose");

  const winOverlay = $("#winOverlay");
  const winSubText = $("#winSubText");
  const winNextBtn = $("#winNextBtn");
  const winAdBtn = $("#winAdBtn");

  const loginBtn = $("#loginBtn");
  const loginBtnText = $("#loginBtnText");
  const userPill = $("#userPill");

  // ---------------------------
  // Internal handlers
  // ---------------------------
  let welcomeStartHandler = null;
  let levelSelectHandler = null;
  let winNextHandler = null;
  let winAdHandler = null;
  let firstGestureHandler = null;

  // ---------------------------
  // Game visibility
  // ---------------------------
  function showGame() {
    root.classList.remove("game-hidden");
  }

  function hideGame() {
    root.classList.add("game-hidden");
  }

  hideGame();

  // ---------------------------
  // Welcome
  // ---------------------------
  function showWelcome(isReturning = false) {
    welcomeTitle.textContent = isReturning
      ? "Welcome back 👋"
      : "Welcome to Adventure Maze";

    welcomeText.textContent = isReturning
      ? "Continue your journey."
      : "Swipe to move, finish mazes, earn rewards.";

    welcomeOverlay.classList.add("show");
  }

  function hideWelcome() {
    welcomeOverlay.classList.remove("show");
  }

  welcomeStartBtn.addEventListener("click", () => {
    hideWelcome();
    welcomeStartHandler?.();
  });

  // ---------------------------
  // Level Select
  // ---------------------------
  function showLevelSelect({ totalLevels, currentLevel, isCompleted }) {
    levelGrid.innerHTML = "";

    for (let i = 1; i <= totalLevels; i++) {
      const btn = document.createElement("button");
      const unlocked = isCompleted?.(i);

      btn.textContent = unlocked ? `Level ${i}` : `🔒 ${i}`;
      btn.disabled = !unlocked;

      btn.onclick = () => {
        hideLevelSelect();
        levelSelectHandler?.(i - 1);
      };

      levelGrid.appendChild(btn);
    }

    levelSelectOverlay.classList.add("show");
  }

  function hideLevelSelect() {
    levelSelectOverlay.classList.remove("show");
  }

  levelSelectClose.onclick = hideLevelSelect;

  // ---------------------------
  // Win popup
  // ---------------------------
  function showWinPopup({ levelNumber, isLastLevel }) {
    winSubText.textContent = isLastLevel
      ? "You finished the last level!"
      : `Level ${levelNumber} complete`;

    winNextBtn.textContent = isLastLevel ? "Restart" : "Next";
    winOverlay.classList.add("show");
  }

  function hideWinPopup() {
    winOverlay.classList.remove("show");
  }

  winNextBtn.onclick = () => winNextHandler?.();
  winAdBtn.onclick = () => winAdHandler?.();

  // ---------------------------
  // First user gesture
  // ---------------------------
  window.addEventListener(
    "pointerdown",
    () => {
      firstGestureHandler?.();
      firstGestureHandler = null;
    },
    { once: true }
  );

  // ---------------------------
  // Helpers
  // ---------------------------
  function setCoins(n) {
    coinCountEl.textContent = String(n ?? 0);
  }

  // ---------------------------
  // RETURN API (CRITICAL)
  // ---------------------------
  return {
    // welcome
    showWelcome,
    hideWelcome,
    onWelcomeStart(fn) {
      welcomeStartHandler = fn;
    },

    // game
    showGame,
    hideGame,

    // level select
    showLevelSelect,
    hideLevelSelect,
    onLevelSelect(fn) {
      levelSelectHandler = fn;
    },

    // win
    showWinPopup,
    hideWinPopup,
    onWinNext(fn) {
      winNextHandler = fn;
    },
    onWinAd(fn) {
      winAdHandler = fn;
    },

    // misc
    setCoins,
    canvas: $("#game"),
    loginBtn,
    loginBtnText,
    userPill,

    onFirstUserGesture(fn) {
      firstGestureHandler = fn;
    },
  };
}

/* ---------------- helpers ---------------- */
function $(id) {
  return document.getElementById(id);
}

function iconBtn(id, svg) {
  return `<button class="iconBtn" id="${id}">${svg}</button>`;
}

function gearSVG() {
  return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/></svg>`;
}

function joystickSVG() {
  return `<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12"/></svg>`;
}