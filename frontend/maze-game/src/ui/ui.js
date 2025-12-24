// src/ui/ui.js

export function mountUI(app) {
  app.innerHTML =
    '<div class="phone">' +
      '<div class="topbar">' +
        '<div class="topRow">' +
          '<div class="brand">' +
            '<div class="logoBox" title="Adventure Maze">' +
              '<img src="/logo.png" alt="Adventure Maze Logo" />' +
            '</div>' +
          '</div>' +

          '<div class="levelWrap">' +
            '<div class="levelText" id="levelTitle">Adventure Maze</div>' +
          '</div>' +

          '<div class="coins" title="Points">' +
            '<div class="coinDot"></div>' +
            '<div id="coinCount">0</div>' +
          '</div>' +
        '</div>' +

        '<div class="iconRow">' +
          iconBtn("settings", gearSVG(), "") +
          iconBtn("controls", joystickSVG(), "") +
          iconBtn("paint", brushSVG(), "NEW") +
          iconBtn("trophy", trophySVG(), "") +
          iconBtn("noads", noAdsSVG(), "") +

          '<div class="loginWrap">' +
            '<button class="iconBtnWide" id="loginBtn"><span id="loginBtnText">Login with Pi</span></button>' +
            '<div class="userPill" id="userPill">User: guest</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="boardWrap">' +
        '<div class="boardFrame">' +
          '<canvas id="game"></canvas>' +
        '</div>' +
      '</div>' +

      '<div class="bottomBar">' +
        '<button class="btn" id="hintBtn">' +
          '<div class="btnIcon">🎬</div>' +
          '<div>HINT</div>' +
        '</button>' +

        '<div class="pill">Swipe to move</div>' +

        '<button class="btn" id="x3Btn">' +
          '<div class="btnIcon">⏩</div>' +
          '<div>×3</div>' +
        '</button>' +
      '</div>' +
    '</div>' +

    // Desktop block (exists for Pi-detect / non-Pi block)
    '<div class="desktopBlock" id="desktopBlock" style="display:none;">' +
      '<div class="desktopCard">' +
        '<div class="desktopTitle">Mobile game</div>' +
        '<div class="desktopText">This game is designed for smartphones.</div>' +
      '</div>' +
    '</div>' +

    // ✅ Level Complete Overlay (hidden)
    '<div class="levelOverlay" id="levelOverlay" style="display:none;">' +
      '<div class="levelOverlayCard">' +
        '<div class="levelOverlayTitle" id="levelOverlayTitle">LEVEL COMPLETE</div>' +
        '<div class="levelOverlayText" id="levelOverlayText">Nice!</div>' +
        '<div class="levelOverlayBtns">' +
          '<button class="levelOverlayBtn primary" id="nextLevelBtn">Next level</button>' +
          '<button class="levelOverlayBtn" id="watchAdBtn">Watch ad (+10)</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  injectOverlayCSS();

  const canvas = document.getElementById("game");
  const loginBtn = document.getElementById("loginBtn");
  const loginBtnText = document.getElementById("loginBtnText");
  const userPill = document.getElementById("userPill");

  const coinCount = document.getElementById("coinCount");
  const levelTitle = document.getElementById("levelTitle");

  const overlay = document.getElementById("levelOverlay");
  const overlayTitle = document.getElementById("levelOverlayTitle");
  const overlayText = document.getElementById("levelOverlayText");
  const nextLevelBtn = document.getElementById("nextLevelBtn");
  const watchAdBtn = document.getElementById("watchAdBtn");

  let nextHandler = null;
  let adHandler = null;

  nextLevelBtn.addEventListener("click", () => nextHandler && nextHandler());
  watchAdBtn.addEventListener("click", () => adHandler && adHandler());

  function setPoints(n) {
    coinCount.textContent = String(n ?? 0);
  }

  function setLevelName(name) {
    levelTitle.textContent = name || "Adventure Maze";
  }

  function showLevelComplete({ levelName, pointsEarned, totalPoints } = {}) {
    overlayTitle.textContent = `${levelName || "LEVEL"} COMPLETE`;
    overlayText.textContent =
      `+${pointsEarned ?? 1} point. Total: ${totalPoints ?? 0}`;
    overlay.style.display = "flex";
  }

  function hideLevelComplete() {
    overlay.style.display = "none";
  }

  function onNextLevel(handler) {
    nextHandler = handler;
  }

  function onWatchAd(handler) {
    adHandler = handler;
  }

  return {
    canvas,
    loginBtn,
    loginBtnText,
    userPill,
    setPoints,
    setLevelName,
    showLevelComplete,
    hideLevelComplete,
    onNextLevel,
    onWatchAd,
  };
}

/* ---------------- UI helpers ---------------- */
function iconBtn(id, svg, badgeText) {
  return (
    '<button class="iconBtn" id="' + id + '">' +
      (badgeText ? '<div class="badgeNew">' + badgeText + "</div>" : "") +
      svg +
    "</button>"
  );
}

function injectOverlayCSS() {
  const style = document.createElement("style");
  style.textContent = `
    .levelOverlay{
      position:fixed;
      inset:0;
      display:flex;
      align-items:center;
      justify-content:center;
      background: rgba(0,0,0,0.72);
      z-index: 9999;
      padding: 16px;
    }
    .levelOverlayCard{
      width: min(420px, 100%);
      border-radius: 18px;
      padding: 18px;
      background: rgba(18,28,60,0.92);
      border: 1px solid rgba(255,255,255,0.14);
      box-shadow: 0 20px 60px rgba(0,0,0,0.45);
      text-align:center;
    }
    .levelOverlayTitle{
      font-size: 20px;
      font-weight: 900;
      color: rgba(234,243,255,0.95);
      margin-bottom: 8px;
      letter-spacing: 0.4px;
    }
    .levelOverlayText{
      font-size: 14px;
      font-weight: 700;
      color: rgba(234,243,255,0.82);
      margin-bottom: 14px;
    }
    .levelOverlayBtns{
      display:flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content:center;
    }
    .levelOverlayBtn{
      height: 44px;
      padding: 0 14px;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.16);
      background: rgba(0,0,0,0.20);
      color: rgba(234,243,255,0.92);
      font-weight: 900;
      cursor:pointer;
      min-width: 160px;
    }
    .levelOverlayBtn.primary{
      background: rgba(37,215,255,0.22);
      border-color: rgba(37,215,255,0.35);
    }
    .levelOverlayBtn:active{ transform: translateY(1px); }
  `;
  document.head.appendChild(style);
}

/* --- SVGs (same as your originals) --- */
function gearSVG() {
  return (
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" stroke="rgba(234,243,255,.95)" stroke-width="1.8"/>' +
    '<path d="M19 13.2v-2.4l-2.1-.5a7.5 7.5 0 0 0-.6-1.4l1.2-1.8-1.7-1.7-1.8 1.2c-.5-.25-1-.45-1.5-.6L12.8 3h-2.4l-.5 2.1c-.5.15-1 .35-1.4.6L6.7 4.5 5 6.2l1.2 1.8c-.25.45-.45.95-.6 1.45L3.5 10.8v2.4l2.1.5c.15.5.35 1 .6 1.4L5 16.9l1.7 1.7 1.8-1.2c.45.25.95.45 1.45.6l.5 2.1h2.4l.5-2.1c.5-.15 1-.35 1.4-.6l1.8 1.2 1.7-1.7-1.2-1.8c.25-.45.45-.95.6-1.45L19 13.2Z" stroke="rgba(234,243,255,.75)" stroke-width="1.6" stroke-linejoin="round"/>' +
    "</svg>"
  );
}
function joystickSVG() {
  return (
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M9 8.5c0-1.7 1.3-3 3-3s3 1.3 3 3v1.2c0 1.7-1.3 3-3 3s-3-1.3-3-3V8.5Z" stroke="rgba(234,243,255,.9)" stroke-width="1.8"/>' +
    '<path d="M6.5 19.5h11c1.2 0 2.2-1 2.2-2.2 0-3-2.4-5.4-5.4-5.4H9.7c-3 0-5.4 2.4-5.4 5.4 0 1.2 1 2.2 2.2 2.2Z" stroke="rgba(234,243,255,.75)" stroke-width="1.8" stroke-linejoin="round"/>' +
    '<path d="M7.3 15.3h2.4M16.3 15.3h-2.4" stroke="rgba(37,215,255,.95)" stroke-width="2.1" stroke-linecap="round"/>' +
    "</svg>"
  );
}
function brushSVG() {
  return (
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M14.5 3.5 20.5 9.5 11 19c-.7.7-1.7 1-2.7.8l-2.8-.6.6-2.8c.2-1 .5-2 1.2-2.7L14.5 3.5Z" stroke="rgba(234,243,255,.85)" stroke-width="1.8" stroke-linejoin="round"/>' +
    '<path d="M7.2 20.1c.1.8-.1 1.6-.7 2.2-.9.9-2.4.9-3.3 0" stroke="rgba(37,215,255,.95)" stroke-width="2.1" stroke-linecap="round"/>' +
    "</svg>"
  );
}
function trophySVG() {
  return (
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M8 5h8v3.2c0 2.8-1.8 5.2-4 5.2s-4-2.4-4-5.2V5Z" stroke="rgba(234,243,255,.85)" stroke-width="1.8" stroke-linejoin="round"/>' +
    '<path d="M9 19h6M10.2 16.5h3.6" stroke="rgba(234,243,255,.75)" stroke-width="1.8" stroke-linecap="round"/>' +
    '<path d="M6.5 6.2H4.5c0 3 1.4 4.8 3.6 5.4M17.5 6.2h2c0 3-1.4 4.8-3.6 5.4" stroke="rgba(37,215,255,.95)" stroke-width="1.8" stroke-linecap="round"/>' +
    "</svg>"
  );
}
function noAdsSVG() {
  return (
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M7 7h10l-1 11H8L7 7Z" stroke="rgba(234,243,255,.85)" stroke-width="1.8" stroke-linejoin="round"/>' +
    '<path d="M9 7V5.5c0-.8.7-1.5 1.5-1.5h3c.8 0 1.5.7 1.5 1.5V7" stroke="rgba(234,243,255,.75)" stroke-width="1.8" stroke-linejoin="round"/>' +
    '<path d="M5 19 19 5" stroke="rgba(255,75,58,.95)" stroke-width="2.4" stroke-linecap="round"/>' +
    "</svg>"
  );
}