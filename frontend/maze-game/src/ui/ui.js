// src/ui/ui.js last change
let loginGateClickHandler = null;
export function onLoginGateClick(fn) {
  loginGateClickHandler = fn;
}

// ----------------------------
// Welcome screen handler
// ----------------------------
let welcomeContinueHandler = null;

export function onWelcomeContinue(fn) {
  welcomeContinueHandler = fn;

}
export function showWelcomeScreen() {
  const el = document.getElementById("welcomeOverlay");
  if (!el) return;

  el.classList.add("show");

  // allow continue after 5s OR tap
  setTimeout(() => {
    const handler = () => {
      el.classList.remove("show");
      welcomeContinueHandler?.();
    };

    el.addEventListener("pointerdown", handler, { once: true });
  }, 5000);
}
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

          
        </div>

        <div class="iconRow">
          ${iconBtn("settingsBtn", gearSVG(), "")}
          ${iconBtn("controls", joystickSVG(), "")}
        
          
              <div class="coins" title="Coins">
                 <div class="coinDot"></div>
              <div id="coinCount">0</div>
          </div>
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
          <div>×3</div></div>
          <div>HINT</div>
        </button>
        <button class="btn" id="skipBtn">
         <div class="btnIcon">⏭️</div>
          <div>×3</div></div>
          <div>SKIP</div>
        </button>
      </div>
    </div>

    <!-- Desktop block (used by Pi detection) -->
    <div class="desktopBlock" id="desktopBlock" style="display:none;">
      <div class="desktopCard">
        <h2>Mobile game</h2>
        <p>This Game is designed for Pi Network Browser Only!</p>
      </div>
    </div>

    <!-- ✄1�7 LOGIN GATE  Test(blocks game until Pi login) -->
    <div class="loginGate" id="loginGate" aria-hidden="true">
      <div class="loginGateCard welcomeCard">
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

    <!-- ✄1�7 SETTINGS OVERLAY -->
    <div class="settingsOverlay" id="settingsOverlay" aria-hidden="true">
      <div class="settingsCard">
        <div class="settingsHeader">
          <div class="settingsTitle">Settings</div>
          <button class="settingsClose" id="settingsCloseBtn" aria-label="Close">✄1�7</button>
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
    <div class="bootOverlay hidden" id="bootOverlay">
  <div class="bootCard">
    <div class="bootSpinner"></div>
    <div class="bootText">Tap to continue</div>
  </div>
</div>
<div class="welcomeOverlay hidden" id="welcomeOverlay">
  <div class="welcomeCard">
    <img src="/logo.png" class="welcomeLogo" alt="Adventure Maze" />

    <h1 class="welcomeTitle">Adventure Maze</h1>

    <p class="welcomeText">
  Roll through mind-bending mazes.<br>
  Collect coins. Unlock levels.
</p>
      Collect coins. Beat all levels.
    </p>

    <button class="welcomeBtn hidden" id="startAdventureBtn">
  Tap anywhere to start
</button>
  </div>
</div>
    <!-- ✄1�7 WIN POPUP -->
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
          <div class="winNote">♄1�7</div>
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
    
    <!-- ✄1�7 LEVEL SELECT POPUP -->
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
  // Elements
  // ---------------------------

const bootOverlay = document.getElementById("bootOverlay");

  
  let bootTapped = false;
  showBootOverlay("Tap to continue");

bootOverlay?.addEventListener("pointerdown", () => {
    if (bootTapped) return;
  bootTapped = true;
  hideBootOverlay();
  showLoginGate();
});

  
  const startBtn = document.getElementById("startAdventureBtn");
// delay button appearance
setTimeout(() => {
  startBtn?.classList.remove("hidden");
}, 5000);

// start game
startBtn?.addEventListener("click", () => {
  document.body.classList.remove("welcomeActive");
  
  document.body.classList.add("welcomeActive");

  welcomeOverlay.classList.add("fadeOut");
  setTimeout(() => {
    welcomeOverlay.style.display = "none";
  }, 600);

  startGameHandler?.(); // 👈 REAL GAME START
});

const welcomeOverlay = document.getElementById("welcomeOverlay");
if (welcomeOverlay) {
  welcomeOverlay.addEventListener("pointerdown", () => {
    // 1. Hide welcome screen
    welcomeOverlay.classList.add("fadeOut");

    setTimeout(() => {
      welcomeOverlay.style.display = "none";
    }, 400);

    // 2. Tell the game to start
    startGameHandler?.();
  });
}

  const coinCountEl = document.getElementById("coinCount");

  // Header login UI
  
  const userPill = document.getElementById("userPill");

  // Login gate
  const loginGate = document.getElementById("loginGate");
  const loginGateBtn = document.getElementById("loginGateBtn");
  const loginGateError = document.getElementById("loginGateError");
  // 🔒 hide legacy login-required UI
const legacyLogin = document.querySelector(".loginRequired");
if (legacyLogin) {
  legacyLogin.style.display = "none";
}




// unlock audio on first gesture (mobile safe)
firstGestureHandler = () => {
  Object.values(SFX).forEach(a => {
    try {
      a.play().then(() => {
        a.pause();
        a.currentTime = 0;
      }).catch(() => {});
    } catch {}
  });
};
function showBootOverlay(text = "Tap to continue") {
  if (!bootOverlay) return;
  bootOverlay.classList.remove("hidden");
  bootOverlay.classList.add("show");
  bootOverlay.querySelector(".bootText").textContent = text;
}

function hideBootOverlay() {
  if (!bootOverlay) return;
  bootOverlay.classList.remove("show");
  bootOverlay.classList.add("hidden");
}
function playSound(name) {
  if (!soundEnabled) return;
  const a = SFX[name];
  if (!a) return;

  try {
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch {}
}

function vibrate(ms = 15) {
  if (!vibrationEnabled) return;
  if (navigator.vibrate) {
    navigator.vibrate(ms);
  }
}

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
  
  
  
  welcomeOverlay?.addEventListener("click", () => {
  welcomeOverlay.classList.add("fadeOut");

  setTimeout(() => {
    welcomeOverlay.style.display = "none";

    // ✅ THIS must exist and be wired
    startGameHandler?.();
  }, 600);
});

  // ✄1�7 FIXED (single correct implementation)
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

     btn.textContent = completed ? `Level ${i}` : `Level ${i}`;
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
  let soundEnabled = true;
let vibrationEnabled = true;

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playClickSound() {
  if (!soundEnabled) return;

  const ctx = getAudioCtx();
  const o = ctx.createOscillator();
  const g = ctx.createGain();

  o.type = "square";
  o.frequency.value = 800;
  g.gain.value = 0.05;

  o.connect(g);
  g.connect(ctx.destination);

  o.start();
  o.stop(ctx.currentTime + 0.05);
}
function vibrate(ms = 20) {
  if (!vibrationEnabled) return;
  if (!navigator.vibrate) return;

  navigator.vibrate(ms);
}

  let winNextHandler = null;
  let winAdHandler = null;
  let startGameHandler = null;

  // ✄1�7 first user gesture (for WebAudio unlock on mobile)
  let firstGestureHandler = null;
  // ---------------------------
// Sound + Haptics Engine
// ---------------------------
const SFX = {
  tap: new Audio("/sfx/tap.mp3"),
  victory: new Audio("/sfx/victory.mp3"),
};

Object.values(SFX).forEach(a => {
  a.preload = "auto";
  a.volume = 0.6;
});

function playSound(name) {
  if (!soundEnabled) return;
  const a = SFX[name];
  if (!a) return;

  try {
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch {}
}

function vibrate(ms = 15) {
  if (!vibrationEnabled) return;
  if (navigator.vibrate) {
    navigator.vibrate(ms);
  }
}



// unlock audio on first user interaction (mobile-safe)
firstGestureHandler = () => {
  Object.values(SFX).forEach(a => {
    try {
      a.play().then(() => {
        a.pause();
        a.currentTime = 0;
      }).catch(() => {});
    } catch {}
  });
};

  window.addEventListener(
    "pointerdown",
    () => {
      firstGestureHandler?.();
      firstGestureHandler = null;
    },
    { once: true }
  );


  // ---------------------------
  // Login Gate API
  // ---------------------------
  
  
  function showLoginGate() {
  
  bootText.textContent = "Logging in...";
}

   loginGateBtn.textContent = "Start Adventure";
loginGateBtn.addEventListener("click", () => {
  if (loginGateBtn.textContent.includes("Start")) {
    hideLoginGate();
  } else {
    loginGateClickHandler?.();
  }
});

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

  // ensurePiLogin calls this( Keep)
  function onLoginClick(fn) {
  loginGateClickHandler = async () => {
    try {
      setGateLoading(true);
      showLoginError("");

      await fn(); // Pi login happens here



// show welcome screen
welcomeOverlay.classList.remove("fadeOut");
      hideLoginGate();
    } catch (e) {
      showLoginError(e?.message || "Login failed");
      throw e;
    } finally {
      setGateLoading(false);
    }
  };
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  playSound("tap");
  vibrate(10);
});



  // allow header button to trigger the same login flow
  loginBtn?.addEventListener("click", () => {
    showLoginGate();
    loginGateClickHandler?.();
  });

  function setUser(user) {
  if (loginBtnText) {
    loginBtnText.textContent = "Logged in";
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

    // header login UI (kept for compatibility)
    loginBtn,
    loginBtnText,
    userPill,
   

    setCoins,

    // ✄1�7 audio unlock hook
    onFirstUserGesture(fn) {
      firstGestureHandler = fn;
    },
    
    onStartGame(fn) {
    startGameHandler = fn;
  },

    // ✄1�7 login gate methods for ensurePiLogin()
    showLoginGate,
    hideLoginGate,
    showLoginError,
     onLoginClick(fn) {
    loginGateClickHandler = fn;
  },
    setUser,

    // Settings API
    setSoundEnabled,
    setVibrationEnabled,
    onSoundToggle(fn) {
   soundHandler = (v) => {
    soundEnabled = v;
    fn?.(v);
  };
},

onVibrationToggle(fn) {
  vibrationHandler = (v) => {
    vibrationEnabled = v;
    fn?.(v);
  };
},

    // Win popup API (✄1�7 kept only once)
    showWinPopup,
    hideWinPopup,
    onWinNext(fn) {
      winNextHandler = fn;
    },
    onWinAd(fn) {
      winAdHandler = fn;
    },

    // ✄1�7 Level select API
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
function gearSVG() {
  return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" stroke="rgba(234,243,255,.95)" stroke-width="1.8"/>
    <path d="M19 13.2v-2.4l-2.1-.5a7.5 7.5 0 0 0-.6-1.4l1.2-1.8-1.7-1.7-1.8 1.2c-.5-.25-1-.45-1.5-.6L12.8 3h-2.4l-.5 2.1c-.5.15-1 .35-1.4.6L6.7 4.5 5 6.2l1.2 1.8c-.25.45-.45.95-.6 1.45L3.5 10.8v2.4l2.1.5c.15.5.35 1 .6 1.4L5 16.9l1.7 1.7 1.8-1.2c.45.25.95.45 1.45.6l.5 2.1h2.4l.5-2.1c.5-.15 1-.35 1.4-.6l1.8 1.2 1.7-1.7-1.2-1.8c.25-.45.45-.95.6-1.45L19 13.2Z" stroke="rgba(234,243,255,.75)" stroke-width="1.6" stroke-linejoin="round"/>
  </svg>`;
}

function joystickSVG() {
  return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9 8.5c0-1.7 1.3-3 3-3s3 1.3 3 3v1.2c0 1.7-1.3 3-3 3s-3-1.3-3-3V8.5Z" stroke="rgba(234,243,255,.9)" stroke-width="1.8"/>
    <path d="M6.5 19.5h11c1.2 0 2.2-1 2.2-2.2 0-3-2.4-5.4-5.4-5.4H9.7c-3 0-5.4 2.4-5.4 5.4 0 1.2 1 2.2 2.2 2.2Z" stroke="rgba(234,243,255,.75)" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M7.3 15.3h2.4M16.3 15.3h-2.4" stroke="rgba(37,215,255,.95)" stroke-width="2.1" stroke-linecap="round"/>
  </svg>`;
}

function brushSVG() {
  return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M14.5 3.5 20.5 9.5 11 19c-.7.7-1.7 1-2.7.8l-2.8-.6.6-2.8c.2-1 .5-2 1.2-2.7L14.5 3.5Z" stroke="rgba(234,243,255,.85)" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M7.2 20.1c.1.8-.1 1.6-.7 2.2-.9.9-2.4.9-3.3 0" stroke="rgba(37,215,255,.95)" stroke-width="2.1" stroke-linecap="round"/>
  </svg>`;
}

function trophySVG() {
  return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M8 5h8v3.2c0 2.8-1.8 5.2-4 5.2s-4-2.4-4-5.2V5Z" stroke="rgba(234,243,255,.85)" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M9 19h6M10.2 16.5h3.6" stroke="rgba(234,243,255,.75)" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M6.5 6.2H4.5c0 3 1.4 4.8 3.6 5.4M17.5 6.2h2c0 3-1.4 4.8-3.6 5.4" stroke="rgba(37,215,255,.95)" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`;
}

function noAdsSVG() {
  return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 7h10l-1 11H8L7 7Z" stroke="rgba(234,243,255,.85)" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M9 7V5.5c0-.8.7-1.5 1.5-1.5h3c.8 0 1.5.7 1.5 1.5V7" stroke="rgba(234,243,255,.75)" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M5 19 19 5" stroke="rgba(255,75,58,.95)" stroke-width="2.4" stroke-linecap="round"/>
  </svg>`;
}