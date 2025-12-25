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
            <div id="coinCount">1888</div>
          </div>
        </div>

        <div class="iconRow">
          ${iconBtn("settings", gearSVG(), "")}
          ${iconBtn("controls", joystickSVG(), "")}
          ${iconBtn("paint", brushSVG(), "")}
    

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

    <!-- Desktop block (used by Pi detection) -->
    <div class="desktopBlock" id="desktopBlock" style="display:none;">
      <div class="desktopCard">
        <h2>Mobile game</h2>
        <p>This game is designed for smartphones. Use swipe on mobile. Desktop is only for testing (arrow keys).</p>
      </div>
    </div>

    <!-- SETTINGS MODAL -->
    <div class="settingsModal" id="settingsModal" style="display:none;">
      <div class="settingsCard">
        <div class="settingsTop">
          <div class="settingsTitle">Settings</div>
          <button class="settingsClose" id="settingsClose">✕</button>
        </div>

        <div class="settingsRow">
          <div class="settingsLabel">
            <div class="settingsName">Sound</div>
            <div class="settingsSub">Rolling sound ON/OFF</div>
          </div>
          <label class="switch">
            <input type="checkbox" id="toggleSound" />
            <span class="slider"></span>
          </label>
        </div>

        <div class="settingsRow">
          <div class="settingsLabel">
            <div class="settingsName">Vibration</div>
            <div class="settingsSub">Vibrate on wall hit</div>
          </div>
          <label class="switch">
            <input type="checkbox" id="toggleVibration" />
            <span class="slider"></span>
          </label>
        </div>

        <div class="settingsNote">
          Wall-hit sound is disabled.
        </div>
      </div>
    </div>
  `;

  // Small UI CSS injection (keeps your build simple)
  const extra = document.createElement("style");
  extra.textContent = `
    .loginWrap{ display:flex; gap:10px; align-items:center; margin-left:auto; }
    .iconBtnWide{
      height:42px;
      padding:0 14px;
      border-radius:14px;
      border:1px solid rgba(255,255,255,.18);
      background: rgba(18,28,60,.55);
      color:#fff;
      font-weight:800;
      letter-spacing:.2px;
      cursor:pointer;
      white-space:nowrap;
    }
    .iconBtnWide:active{ transform: translateY(1px); }
    .iconBtnWide:disabled{ opacity:.6; cursor:not-allowed; transform:none; }
    .userPill{
      height:42px;
      display:flex;
      align-items:center;
      padding:0 12px;
      border-radius:14px;
      border:1px solid rgba(255,255,255,.12);
      background: rgba(0,0,0,.22);
      color: rgba(234,243,255,.9);
      font-weight:700;
      font-size:13px;
      white-space:nowrap;
    }
    @media (max-width: 420px){
      .loginWrap{ width:100%; justify-content:space-between; margin-left:0; }
      .iconBtnWide{ flex:1; }
      .userPill{ flex:1; justify-content:center; }
    }

    /* SETTINGS modal */
    .settingsModal{
      position:fixed;
      inset:0;
      z-index:10000;
      background: rgba(0,0,0,.45);
      backdrop-filter: blur(6px);
      display:flex;
      align-items:center;
      justify-content:center;
      padding:16px;
    }
    .settingsCard{
      width:min(520px, 100%);
      border-radius:22px;
      border:1px solid rgba(255,255,255,.14);
      background: rgba(8,12,24,.85);
      box-shadow: 0 18px 60px rgba(0,0,0,.6);
      padding:16px;
      color: rgba(234,243,255,.95);
    }
    .settingsTop{
      display:flex;
      align-items:center;
      justify-content:space-between;
      margin-bottom:10px;
    }
    .settingsTitle{
      font-weight:950;
      font-size:18px;
      letter-spacing:.3px;
    }
    .settingsClose{
      width:38px; height:38px;
      border-radius:12px;
      border:1px solid rgba(255,255,255,.16);
      background: rgba(255,255,255,.06);
      color:#fff;
      font-weight:900;
      cursor:pointer;
    }
    .settingsRow{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      padding:12px 10px;
      border-radius:16px;
      background: rgba(255,255,255,.05);
      border: 1px solid rgba(255,255,255,.10);
      margin-top:10px;
    }
    .settingsName{ font-weight:900; }
    .settingsSub{ font-size:12px; opacity:.7; margin-top:2px; }
    .settingsNote{
      margin-top:12px;
      font-size:12px;
      opacity:.65;
    }

    /* Toggle switch */
    .switch{ position:relative; display:inline-block; width:54px; height:32px; }
    .switch input{ opacity:0; width:0; height:0; }
    .slider{
      position:absolute; cursor:pointer; inset:0;
      background: rgba(255,255,255,.18);
      border:1px solid rgba(255,255,255,.18);
      transition:.2s;
      border-radius:999px;
    }
    .slider:before{
      position:absolute; content:"";
      height:24px; width:24px;
      left:4px; top:3px;
      background:white;
      transition:.2s;
      border-radius:999px;
    }
    .switch input:checked + .slider{
      background: rgba(37,215,255,.35);
      border-color: rgba(37,215,255,.35);
    }
    .switch input:checked + .slider:before{
      transform: translateX(22px);
    }
  `;
  document.head.appendChild(extra);

  const settingsBtn = document.getElementById("settings");
  const settingsModal = document.getElementById("settingsModal");
  const settingsClose = document.getElementById("settingsClose");

  const toggleSound = document.getElementById("toggleSound");
  const toggleVibration = document.getElementById("toggleVibration");

  function openSettings() {
    settingsModal.style.display = "flex";
  }
  function closeSettings() {
    settingsModal.style.display = "none";
  }

  settingsBtn?.addEventListener("click", openSettings);
  settingsClose?.addEventListener("click", closeSettings);
  settingsModal?.addEventListener("click", (e) => {
    // click outside card closes
    if (e.target === settingsModal) closeSettings();
  });

  let onSoundCb = null;
  let onVibrationCb = null;

  toggleSound?.addEventListener("change", () => {
    onSoundCb?.(!!toggleSound.checked);
  });
  toggleVibration?.addEventListener("change", () => {
    onVibrationCb?.(!!toggleVibration.checked);
  });

  return {
    canvas: document.getElementById("game"),
    loginBtn: document.getElementById("loginBtn"),
    loginBtnText: document.getElementById("loginBtnText"),
    userPill: document.getElementById("userPill"),

    // settings API
    setSoundEnabled(v) {
      if (toggleSound) toggleSound.checked = !!v;
    },
    setVibrationEnabled(v) {
      if (toggleVibration) toggleVibration.checked = !!v;
    },
    onSoundToggle(cb) {
      onSoundCb = cb;
    },
    onVibrationToggle(cb) {
      onVibrationCb = cb;
    },
    openSettings,
    closeSettings,
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