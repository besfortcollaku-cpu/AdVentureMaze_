// src/ui/ui.js



function iconBtn(id, svg) {

  return `<button class="iconBtn" id="${id}">${svg}</button>`;

}



function gearSVG() {

  return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">

    <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" stroke="rgba(234,243,255,.95)" stroke-width="1.8"/>

    <path d="M19 13.2v-2.4l-2.1-.5a7.5 7.5 0 0 0-.6-1.4l1.2-1.8-1.7-1.7-1.8 1.2c-.5-.25-1-.45-1.5-.6L12.8 3h-2.4l-.5 2.1c-.5.15-1 .35-1.4.6L6.7 4.5 5 6.2l1.2 1.8c-.25.45-.45.95-.6 1.45L3.5 10.8v2.4l2.1.5c.15.5.35 1 .6 1.4L5 16.9l1.7 1.7 1.8-1.2c.45.25.95.45 1.45.6l.5 2.1h2.4l.5-2.1c.5-.15 1-.35 1.4-.6l1.8 1.2 1.7-1.7-1.2-1.8c.25-.45.45-.95.6-1.45L19 13.2Z" stroke="rgba(234,243,255,.75)" stroke-width="1.6" stroke-linejoin="round"/>

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

            <div class="levelText">LEVEL 1</div>

          </div>



          <div class="coins" title="Coins">

            <div class="coinDot"></div>

            <div id="coinCount">0</div>

          </div>

        </div>



        <div class="iconRow">

          ${iconBtn("settings", gearSVG())}

          ${iconBtn("paint", brushSVG())}

          ${iconBtn("trophy", trophySVG())}



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



    <div class="desktopBlock" id="desktopBlock">

      <div class="desktopCard">

        <h2>Mobile game</h2>

        <p>This game is designed for smartphones. Use swipe on mobile.</p>

      </div>

    </div>

  `;



  return {

    canvas: document.getElementById("game"),

    loginBtn: document.getElementById("loginBtn"),

    loginBtnText: document.getElementById("loginBtnText"),

    userPill: document.getElementById("userPill"),

    desktopBlock: document.getElementById("desktopBlock"),

  };

}