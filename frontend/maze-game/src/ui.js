export function mountUI(app) {

  app.innerHTML =

    '<div class="phone">' +

      '<div class="topbar">' +

        '<div class="topRow">' +

          '<div class="brand">' +

            '<div class="logoBox" title="Adventure Maze">' +

              '<img src="/logo.png" alt="Adventure Maze Logo" />' +

            "</div>" +

          "</div>" +



          '<div class="levelWrap">' +

            '<div class="levelNew">NEW!</div>' +

            '<div class="levelText">LEVEL 242</div>' +

          "</div>" +



          '<div class="coins" title="Coins">' +

            '<div class="coinDot"></div>' +

            '<div id="coinCount">1888</div>' +

          "</div>" +

        "</div>" +



        '<div class="iconRow">' +

          iconBtn("settings", gearSVG(), "") +

          iconBtn("controls", joystickSVG(), "") +

          iconBtn("paint", brushSVG(), "NEW") +

          iconBtn("trophy", trophySVG(), "") +

          iconBtn("noads", noAdsSVG(), "") +



          '<div class="loginWrap">' +

            '<button class="iconBtnWide" id="loginBtn"><span id="loginBtnText">Login with Pi</span></button>' +

            '<div class="userPill" id="userPill">User: guest</div>' +

          "</div>" +

        "</div>" +

      "</div>" +



      '<div class="boardWrap">' +

        '<div class="boardFrame">' +

          '<canvas id="game"></canvas>' +

        "</div>" +

      "</div>" +



      '<div class="bottomBar">' +

        '<button class="btn" id="hintBtn">' +

          '<div class="btnIcon">🎬</div>' +

          "<div>HINT</div>" +

        "</button>" +



        '<div class="pill">Swipe to move</div>' +



        '<button class="btn" id="x3Btn">' +

          '<div class="btnIcon">⏩</div>' +

          "<div>×3</div>" +

        "</button>" +

      "</div>" +

    "</div>" +



    '<div class="desktopBlock" id="desktopBlock">' +

      '<div class="desktopCard">' +

        "<h2>Mobile game</h2>" +

        "<p>This game is designed for smartphones. Use swipe on mobile. Desktop is only for testing (arrow keys).</p>" +

      "</div>" +

    "</div>";



  // ✅ Inject small CSS for login UI (exactly as your code)

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

  `;

  document.head.appendChild(extra);



  /* desktop overlay logic (exactly as your code) */

  function isTouchDevice() {

    return "ontouchstart" in window || navigator.maxTouchPoints > 0;

  }

  function isNarrow() {

    return window.matchMedia("(max-width: 700px)").matches;

  }

  const desktopBlock = document.getElementById("desktopBlock");

  function updateDesktopOverlay() {

    const show = !isTouchDevice() && !isNarrow();

    desktopBlock.style.display = show ? "flex" : "none";

  }

  updateDesktopOverlay();

  window.addEventListener("resize", updateDesktopOverlay);



  const canvas = document.getElementById("game");

  const loginBtn = document.getElementById("loginBtn");

  const loginBtnText = document.getElementById("loginBtnText");

  const userPill = document.getElementById("userPill");



  return { canvas, loginBtn, loginBtnText, userPill };

}



function iconBtn(id, svg, badgeText) {

  return (

    '<button class="iconBtn" id="' + id + '">' +

      (badgeText ? '<div class="badgeNew">' + badgeText + "</div>" : "") +

      svg +

    "</button>"

  );

}



/* ---------- SVG icons ---------- */

function gearSVG() {

  return (

    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +

    '<path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" stroke="rgba(234,243,255,.95)" stroke-width="1.8"/>' +

    '<path d="M19 13.2v-2.4l-2.1-.5a7.5 7.5 0 0 0-.6-1.4l1.2-1.8-1.7-1.7-1.8 1.2c-.5-.25-1-.45-1.5-.6L12.8 3h-2.4l-.5 2.1c-.5.15-1 .35-1.4.6L6.7 4.5 5 6.2l1.2 1.8c-.25.45-.45.95-.6 1.45L3.5 10.8v2.4l2.1.5c.15.5.35 1 .6 1.4L5 16.9l1.7 1.7 1.8-1.2c.45.25.95.45 1.45.6l.5 2.1h2.4l.5-2.1c.5-.15 1-.35 1.4-.6l1.8 1.2 1.7-1.7-1.2-1.8c.25-.45.45-.95.6-1.45L19 13.2Z" stroke="rgba(234,243,255,.75)" stroke-width="1.6" stroke-linejoin="round"/>' +

    "</svg>"

  );

}

function gearSVG() {

  return (

    '<svg viewBox="0 0 24 24" fill="none">' +

      '<path d="M12 15.2a3.2 3.2 0 1 0 0-6.4" stroke="white"/>' +

    '</svg>'

  );

}

