// src/ui/ui.js last change

export function mountUI(app) {
  app.innerHTML = `
    <div class="phone">
      <div class="topbar">
        <div class="topRow">
            <div class="levelWrap">
              <div class="levelText" id="levelText">Level 1</div>
                
            </div>
         </div>     
        
          </div>
            <div class="iconRow">
            ${iconBtn("accountBtn", userAccountSVG(), "")}
            ${iconBtn("settingsBtn", gearSVG(), "")}
            ${iconBtn("controls", joystickSVG(), "")}
         </div>
         <div class="coins" title="Coins">
                  <div class="coinDot"></div>
                   <div id="coinCount">0</div>
                </div>
         </div>
            <div class="boardWrap">
              <div class="boardFrame">
                <canvas id="game"></canvas>
              </div>
            </div>
  <<div class="bottomBar">
  <button id="hintBtn" class="bottomBtn left">
    <span class="icon">❓</span>
    <span>Hint</span>
  </button>

  <div class="swipeHint">
    Swipe to move
  </div>

  <button id="x3Btn" class="bottomBtn right">
    <span class="icon">⏭</span>
    <span>Skip</span>
  </button>
</div>
     </div>
     
    <!-- ✅ LOGIN GATE (blocks game until Pi login) -->
    <div class="loginGate" id="loginGate" aria-hidden="true">
      <div class="loginGateCard">
        <div class="loginGateTitle">Login required</div>
        <div class="loginGateSub">
          Please login with Pi account to start playing. 
        </div>

        <button class="loginGateBtn" id="loginGateBtn">
          Login
        </button>

        <div class="loginGateError" id="loginGateError"></div>

        <div class="loginGateNote">
          Tip: open inside Pi Browser.
        </div>
      </div>
    </div>

    <!-- ✅ SETTINGS OVERLAY -->
    <div class="settingsOverlay" id="settingsOverlay" aria-hidden="true">
      <div class="settingsCard">
        <div class="settingsHeader">
          <div class="settingsTitle">Settings</div>
          <button class="settingsClose" id="settingsCloseBtn" aria-label="Close">✕</button>
        </div>

        <div class="settingsRow">
          <div class="settingsLeft">
            <div class="settingsLabel">Sound</div>
            <div class="settingsSub">Rolling + victory (no wall-hit sound)</div>
          </div>
          <label class="toggle">
            <input type="checkbox" id="soundToggle" />
            <span class="track"></span>
          </label>
        </div>

        <div class="settingsRow">
          <div class="settingsLeft">
            <div class="settingsLabel">Vibration</div>
            <div class="settingsSub">Small vibration when ball stops</div>
          </div>
          <label class="toggle">
            <input type="checkbox" id="vibrationToggle" />
            <span class="track"></span>
          </label>
        </div>

        <div class="settingsFoot">
          <div class="settingsNote">Changes are saved automatically.</div>
        </div>
      </div>
    </div>

    <!-- ✅ WIN POPUP -->
    <div class="winOverlay" id="winOverlay" aria-hidden="true">
      <div class="winCard">
        <div class="winSparkLayer"></div>

        <div class="winHeader">
          <div class="winBadge">CONGRATS!</div>
          <div class="winTitle">Level Complete</div>
          <div class="winSub" id="winSubText">You finished Level</div>
        </div>

        <div class="winMusic">
          <div class="winPulse"></div>
          <div class="winNote">♪</div>
          <div class="winMusicText">Victory vibes</div>
        </div>

        <div class="winRow">
          <button class="winBtnPrimary" id="winNextBtn">Next level</button>
          <button class="winBtnSecondary" id="winAdBtn">
            Watch Ad <span class="winPlus">+50</span>
            <span class="winCoinDot" aria-hidden="true"></span>
          </button>
        </div>

        <div class="winHint">Tip: Watch ad gives +50 coins</div>
      </div>
    </div>
    
    <!-- ✅ LEVEL SELECT POPUP -->
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
<div id="adBanner"></div>
</div>

  `;

  
  document.head.appendChild(extra);

  // ---------------------------
  // Elements
  // ---------------------------
  const coinCountEl = document.getElementById("coinCount");
  const levelTextEl = document.getElementById("levelText");

  // Header login UI
  const loginBtn = document.getElementById("loginBtn");
  const loginBtnText = document.getElementById("loginBtnText");
  const userPill = document.getElementById("userPill");

  // Login gate
  const loginGate = document.getElementById("loginGate");
  const loginGateBtn = document.getElementById("loginGateBtn");
  const loginGateError = document.getElementById("loginGateError");

  // Settings
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsOverlay = document.getElementById("settingsOverlay");
  const settingsCloseBtn = document.getElementById("settingsCloseBtn");
  const soundToggle = document.getElementById("soundToggle");
  const vibrationToggle = document.getElementById("vibrationToggle");

  // Win popup
  const winOverlay = document.getElementById("winOverlay");
  const winSubText = document.getElementById("winSubText");
  const winNextBtn = document.getElementById("winNextBtn");
  const winAdBtn = document.getElementById("winAdBtn");
  
  
  // Level select
  const levelSelectOverlay = document.getElementById("levelSelectOverlay");
  const levelGrid = document.getElementById("levelGrid");
  const levelSelectClose = document.getElementById("levelSelectClose");

  let levelSelectHandler = null;

  // ✅ FIXED (single correct implementation)
  function showLevelSelect({ totalLevels, isCompleted, currentLevel }) {
    if (!levelGrid || !levelSelectOverlay) return;

    levelGrid.innerHTML = "";

    for (let i = 1; i <= totalLevels; i++) {
      const btn = document.createElement("button");

      const completed =
        typeof isCompleted === "function"
          ? isCompleted(i)
          : false;

      const isCurrent = i === currentLevel;

      btn.className =
        "levelBtn" +
        (completed ? "" : " locked") +
        (isCurrent ? " current" : "");

      btn.textContent = completed ? `✔ Level ${i}` : `🔒 ${i}`;

      if (completed) {
        btn.addEventListener("click", () => {
          hideLevelSelect();
          levelSelectHandler?.(i - 1);
        });
      }

      levelGrid.appendChild(btn);
    }

    levelSelectOverlay.classList.add("show");
    levelSelectOverlay.setAttribute("aria-hidden", "false");
  }

  function hideLevelSelect() {
    levelSelectOverlay?.classList.remove("show");
    levelSelectOverlay?.setAttribute("aria-hidden", "true");
  }

  levelSelectClose?.addEventListener("click", hideLevelSelect);
  levelSelectOverlay?.addEventListener("click", (e) => {
    if (e.target === levelSelectOverlay) hideLevelSelect();
  });



  // ---------------------------
  // State + handlers
  // ---------------------------
  let soundHandler = null;
  let vibrationHandler = null;

  let winNextHandler = null;
  let winAdHandler = null;

  // ✅ first user gesture (for WebAudio unlock on mobile)
  let firstGestureHandler = null;
  window.addEventListener(
    "pointerdown",
    () => {
      firstGestureHandler?.();
      firstGestureHandler = null;
    },
    { once: true }
  );

  // ✅ login gate click
  let loginGateClickHandler = null;
  loginGateBtn?.addEventListener("click", () => loginGateClickHandler?.());

  function setCoins(n) {
    if (coinCountEl) coinCountEl.textContent = String(n ?? 0);
  }

  // ---------------------------
  // Login Gate API
  // ---------------------------
  function showLoginGate() {
    if (!loginGate) return;
    loginGate.classList.add("show");
    loginGate.setAttribute("aria-hidden", "false");
    showLoginError(""); // clear
    setGateLoading(false);
  }

  function hideLoginGate() {
    if (!loginGate) return;
    loginGate.classList.remove("show");
    loginGate.setAttribute("aria-hidden", "true");
    showLoginError("");
    setGateLoading(false);
  }

  function showLoginError(msg) {
    if (!loginGateError) return;
    loginGateError.textContent = msg ? String(msg) : "";
  }

  function setGateLoading(isLoading) {
    if (!loginGateBtn) return;
    loginGateBtn.disabled = !!isLoading;
    loginGateBtn.textContent = isLoading ? "Logging in..." : "Login with Pi";
  }

  // ensurePiLogin calls this
  function onLoginClick(fn) {
    loginGateClickHandler = async () => {
      try {
        setGateLoading(true);
        await fn();
      } finally {
        setGateLoading(false);
      }
    };
  }

  // allow header button to trigger the same login flow
  loginBtn?.addEventListener("click", () => {
    showLoginGate();
    loginGateClickHandler?.();
  });

  function setUser(user) {
  const name = user?.username || "guest";

  // update text
  if (userPill) userPill.textContent = `User: ${name}`;
  if (loginBtnText) {
    loginBtnText.textContent =
      name === "guest" ? "Login with Pi" : "Logged in ✅";
  }

  // ✅ NEW: toggle buttons after login
  

 
  if (name !== "guest") {
    // logged in
    loginBtn?.style.setProperty("display", "none");
    userPill?.style.setProperty("display", "none");
  } else {
    // logged out / guest
    loginBtn?.style.setProperty("display", "inline-flex");
    userPill?.style.setProperty("display", "inline-flex");

  }
}

  // ---------------------------
  // Settings
  // ---------------------------
  function openSettings() {
    if (!settingsOverlay) return;
    settingsOverlay.classList.add("show");
    settingsOverlay.setAttribute("aria-hidden", "false");
  }

  function closeSettings() {
    if (!settingsOverlay) return;
    settingsOverlay.classList.remove("show");
    settingsOverlay.setAttribute("aria-hidden", "true");
  }

  settingsBtn?.addEventListener("click", openSettings);
  settingsCloseBtn?.addEventListener("click", closeSettings);
  settingsOverlay?.addEventListener("click", (e) => {
    if (e.target === settingsOverlay) closeSettings();
  });

  soundToggle?.addEventListener("change", () => {
    soundHandler?.(!!soundToggle.checked);
  });

  vibrationToggle?.addEventListener("change", () => {
    vibrationHandler?.(!!vibrationToggle.checked);
  });

  // ---------------------------
  // Win popup
  // ---------------------------
  winNextBtn?.addEventListener("click", () => winNextHandler?.());
  winAdBtn?.addEventListener("click", () => winAdHandler?.());

  function showWinPopup({ levelNumber, isLastLevel } = {}) {
      if (window.IS_GUEST) {
  watchAdBtn.style.display = "none";
}
    if (winSubText) {
      winSubText.textContent = isLastLevel
        ? `You finished the last level!`
        : `You finished Level ${levelNumber}`;
    }

    if (winNextBtn) winNextBtn.textContent = isLastLevel ? "Restart" : "Next level";

    if (winOverlay) {
      winOverlay.classList.add("show");
      winOverlay.setAttribute("aria-hidden", "false");
    }
  }

  function hideWinPopup() {
    if (!winOverlay) return;
    winOverlay.classList.remove("show");
    winOverlay.setAttribute("aria-hidden", "true");
  }

  function setSoundEnabled(v) {
    if (soundToggle) soundToggle.checked = !!v;
  }

  function setVibrationEnabled(v) {
    if (vibrationToggle) vibrationToggle.checked = !!v;
  }

  return {
    onHint(fn) { hintHandler = fn; },
    onSkip(fn) { skipHandler = fn; },
    canvas: document.getElementById("game"),
setLevel(n) {
  levelText.textContent = `Level ${n}`;

  levelText.classList.remove("levelPop");
  void levelText.offsetWidth; // 🔑 force reflow
  levelText.classList.add("levelPop");

  setTimeout(() => {
    levelText.classList.remove("levelPop");
  }, 300);
},
    // header login UI
    loginBtn,
    loginBtnText,
    userPill,

    setCoins,

    // ✅ audio unlock hook
    onFirstUserGesture(fn) {
      firstGestureHandler = fn;
    },

    // ✅ login gate methods for ensurePiLogin()
    showLoginGate,
    hideLoginGate,
    showLoginError,
    onLoginClick,
    setUser,

    // Settings API
    setSoundEnabled,
    setVibrationEnabled,
    onSoundToggle(fn) {
     soundHandler = fn;
    },
    onVibrationToggle(fn) {
      vibrationHandler = fn;
    },
    setLevel(n) {
  if (!levelTextEl) return;
  levelTextEl.textContent = `Level ${n}`;

  void levelTextEl.offsetWidth;
  levelTextEl.classList.add("levelPop");
},


    // Win popup API (✅ kept only once)
    showWinPopup,
    hideWinPopup,
    onWinNext(fn) {
      winNextHandler = fn;
    },
    onWinAd(fn) {
      winAdHandler = fn;
    },

    // ✅ Level select API
    showLevelSelect,
    hideLevelSelect,
    onLevelSelect(fn) {
    levelSelectHandler = fn;
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
/* --- SVG functions --- */

function userAccountSVG() {
  return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <!-- Head -->
    <path d="M9 8.5c0-1.9 1.6-3.5 3-3.5s3 1.6 3 3.5-1.6 3.3-3 3.3-3-1.4-3-3.3Z"
      stroke="rgba(234,243,255,.9)"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"/>

    <!-- Body -->
    <path d="M5.5 19c0-3.1 2.5-5.6 5.6-5.6h1.8c3.1 0 5.6 2.5 5.6 5.6"
      stroke="rgba(234,243,255,.75)"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"/>

    <!-- Accent (active user) -->
    <path d="M10 14.6h4"
      stroke="rgba(37,215,255,.95)"
      stroke-width="2.2"
      stroke-linecap="round"/>
  </svg>`;
}
function gearSVG() {
  return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" stroke="rgba(234,243,255,.95)" stroke-width="1.8"/>
    <path d="M19 13.2v-2.4l-2.1-.5a7.5 7.5 0 0 0-.6-1.4l1.2-1.8-1.7-1.7-1.8 1.2c-.5-.25-1-.45-1.5-.6L12.8 3h-2.4l-.5 2.1c-.5.15-1 .35-1.4.6L6.7 4.5 5 6.2l1.2 1.8c-.25.45-.45.95-.6 1.45L3.5 10.8v2.4l2.1.5c.15.5.35 1 .6 1.4L5 16.9l1.7 1.7 1.8-1.2c.45.25.95.45 1.45.6l.5 2.1h2.4l.5-2.1c.5-.15 1-.35 1.4-.6l1.8 1.2 1.7-1.7-1.2-1.8c.25-.45.45-.95.6-1.45L19 13.2Z" stroke="rgba(234,243,255,.75)" stroke-width="1.6" stroke-linejoin="round"/>
  </svg>`;
}

function joystickSVG() {
return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <!-- Level 1 -->
    <path d="M4 18h16" stroke="rgba(234,243,255,.75)" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M4 18h6" stroke="rgba(37,215,255,.95)" stroke-width="2.2" stroke-linecap="round"/>

    <!-- Level 2 -->
    <path d="M6 13h12" stroke="rgba(234,243,255,.75)" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M6 13h5" stroke="rgba(37,215,255,.95)" stroke-width="2.2" stroke-linecap="round"/>

    <!-- Level 3 -->
    <path d="M8 8h8" stroke="rgba(234,243,255,.75)" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M8 8h4" stroke="rgba(37,215,255,.95)" stroke-width="2.2" stroke-linecap="round"/>
  </svg>`;

}

function gameHintsSVG() {
  return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <!-- Bulb top -->
    <path d="M8 9.2a4 4 0 1 1 8 0c0 1.6-.8 2.6-1.8 3.6-.7.7-1.2 1.3-1.2 2.2"
      stroke="rgba(234,243,255,.9)"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"/>

    <!-- Bulb base -->
    <path d="M10 17h4M10.6 19h2.8"
      stroke="rgba(234,243,255,.75)"
      stroke-width="1.8"
      stroke-linecap="round"/>

    <!-- Hint glow / idea accent -->
    <path d="M12 6.6v-1.6"
      stroke="rgba(37,215,255,.95)"
      stroke-width="2.2"
      stroke-linecap="round"/>
  </svg>`;
}


function skipSVG() {
  return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <!-- Skip triangle -->
    <path d="M7 6l7 6-7 6V6Z"
      stroke="rgba(234,243,255,.9)"
      stroke-width="1.8"
      stroke-linejoin="round"/>

    <!-- Skip bar -->
    <path d="M16.5 6v12"
      stroke="rgba(37,215,255,.95)"
      stroke-width="2.2"
      stroke-linecap="round"/>
  </svg>`;
}