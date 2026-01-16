// src/ui/ui.js

/* =====================================================
   STATE
===================================================== */
let loginGateClickHandler = null;
let welcomeContinueHandler = null;
let firstGestureHandler = null;

let soundHandler = null;
let vibrationHandler = null;
let winNextHandler = null;
let winAdHandler = null;
let levelSelectHandler = null;

/* =====================================================
   EXPORTED API (NO DOM ACCESS HERE)
===================================================== */
export function onLoginGateClick(fn) {
  loginGateClickHandler = fn;
}

export function onWelcomeContinue(fn) {
  welcomeContinueHandler = fn;
}

export function onFirstUserGesture(fn) {
  firstGestureHandler = fn;
}

export function onSoundToggle(fn) {
  soundHandler = fn;
}

export function onVibrationToggle(fn) {
  vibrationHandler = fn;
}

export function onWinNext(fn) {
  winNextHandler = fn;
}

export function onWinAd(fn) {
  winAdHandler = fn;
}

export function onLevelSelect(fn) {
  levelSelectHandler = fn;
}

/* =====================================================
   MAIN UI MOUNT
===================================================== */
export function mountUI(app) {
  app.innerHTML = `
    <div class="phone">
      <div class="topbar">
        <div class="topRow">
          <div class="brand">
            <div class="logoBox">
              <img src="/logo.png" alt="Adventure Maze Logo" />
            </div>
          </div>

          <div class="levelWrap">
            <div class="levelNew">NEW!</div>
            <div class="levelText">Adventure Maze</div>
          </div>
        </div>

        <div class="iconRow">
          ${iconBtn("settingsBtn", gearSVG(), "")}
          ${iconBtn("controls", joystickSVG(), "")}
          <div class="coins">
            <div class="coinDot"></div>
            <div id="coinCount">0</div>
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
          <div class="btnIcon">💡</div>
          <div>HINT</div>
        </button>
        <button class="btn" id="skipBtn">
          <div class="btnIcon">⏭️</div>
          <div>SKIP</div>
        </button>
      </div>
    </div>

    <div class="bootOverlay" id="bootOverlay">
      <div class="bootSpinner"></div>
      <div class="bootText">Tap to continue</div>
    </div>

    <div class="welcomeOverlay" id="welcomeOverlay">
      <div class="welcomeCard">
        <h1>Welcome</h1>
        <p>Guide the ball through the maze.<br/>Avoid traps. Reach the goal.</p>
        <div class="tapAnywhere">Tap anywhere to start</div>
      </div>
    </div>

    <div class="levelSelectOverlay" id="levelSelectOverlay">
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

  /* =====================================================
     DOM REFERENCES
  ===================================================== */
  const coinCountEl = document.getElementById("coinCount");
  const bootOverlay = document.getElementById("bootOverlay");
  const welcomeOverlay = document.getElementById("welcomeOverlay");
  const levelSelectOverlay = document.getElementById("levelSelectOverlay");
  const levelGrid = document.getElementById("levelGrid");

  /* =====================================================
     BOOT OVERLAY
  ===================================================== */
  bootOverlay.addEventListener("pointerdown", () => {
    firstGestureHandler?.();       // audio unlock
    loginGateClickHandler?.();     // Pi login
  });

  function hideBootOverlay() {
    bootOverlay.classList.remove("show");
  }

  function showBootOverlay(text = "Tap to continue") {
    bootOverlay.querySelector(".bootText").textContent = text;
    bootOverlay.classList.add("show");
  }

  /* =====================================================
     WELCOME SCREEN
  ===================================================== */
  function showWelcomeScreen() {
    welcomeOverlay.classList.add("show");

    setTimeout(() => {
      const handler = () => {
        welcomeOverlay.classList.remove("show");
        welcomeContinueHandler?.();
      };
      welcomeOverlay.addEventListener("pointerdown", handler, { once: true });
    }, 5000);
  }

  function hideWelcomeScreen() {
    welcomeOverlay.classList.remove("show");
  }

  /* =====================================================
     LEVEL SELECT
  ===================================================== */
  function showLevelSelect({ totalLevels, currentLevel, isCompleted }) {
    levelGrid.innerHTML = "";
    for (let i = 1; i <= totalLevels; i++) {
      const btn = document.createElement("button");
      const completed = isCompleted?.(i);
      btn.textContent = `Level ${i}`;
      btn.className = completed ? "levelBtn" : "levelBtn locked";
      if (completed) {
        btn.addEventListener("click", () => {
          hideLevelSelect();
          levelSelectHandler?.(i - 1);
        });
      }
      levelGrid.appendChild(btn);
    }
    levelSelectOverlay.classList.add("show");
  }

  function hideLevelSelect() {
    levelSelectOverlay.classList.remove("show");
  }

  document
    .getElementById("levelSelectClose")
    ?.addEventListener("click", hideLevelSelect);

  /* =====================================================
     PUBLIC UI API RETURN
  ===================================================== */
  return {
    canvas: document.getElementById("game"),

    setCoins(n) {
      coinCountEl.textContent = String(n ?? 0);
    },

    showBootOverlay,
    hideBootOverlay,

    showWelcomeScreen,
    hideWelcomeScreen,

    showLevelSelect,
    hideLevelSelect,
  };
}

/* =====================================================
   HELPERS (UNCHANGED)
===================================================== */
function iconBtn(id, svg, badgeText) {
  return `
    <button class="iconBtn" id="${id}">
      ${badgeText ? `<div class="badgeNew">${badgeText}</div>` : ""}
      ${svg}
    </button>
  `;
}

function gearSVG() {
  return `<svg viewBox="0 0 24 24"></svg>`;
}

function joystickSVG() {
  return `<svg viewBox="0 0 24 24"></svg>`;
}