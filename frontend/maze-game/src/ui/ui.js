// src/ui/ui.js
export function mountUI(app) {
  app.innerHTML = `
    <div class="phone">
      <div class="topbar">
        <div class="levelText" id="levelText">Level 1</div>
        <div class="coins">
          🪙 <span id="coinCount">0</span>
        </div>
      </div>

      <div class="boardWrap">
        <canvas id="game"></canvas>
      </div>

      <div class="bottomBar">
        <button id="hintBtn">Hint</button>
        <button id="controls">Levels</button>
        <button id="x3Btn">Skip</button>
      </div>

      <div id="loginGate" style="display:none">
        <div class="loginBox">
          <h2 id="loginTitle">Login</h2>
          <p id="loginMessage"></p>
          <button id="loginBtn">Login with Pi</button>
        </div>
      </div>

      <div id="winPopup" style="display:none">
        <h2 id="winTitle"></h2>
        <button id="winNextBtn">Next</button>
        <button id="winAdBtn">Watch Ad</button>
      </div>
    </div>
  `;

  const canvas = app.querySelector("#game");
  const coinCount = app.querySelector("#coinCount");
  const levelText = app.querySelector("#levelText");

  const loginGate = app.querySelector("#loginGate");
  const loginTitle = app.querySelector("#loginTitle");
  const loginMessage = app.querySelector("#loginMessage");
  const loginBtn = app.querySelector("#loginBtn");

  const winPopup = app.querySelector("#winPopup");
  const winTitle = app.querySelector("#winTitle");
  const winNextBtn = app.querySelector("#winNextBtn");
  const winAdBtn = app.querySelector("#winAdBtn");

  let loginHandler = null;
  let winNextHandler = null;
  let winAdHandler = null;

  loginBtn.onclick = () => loginHandler && loginHandler();
  winNextBtn.onclick = () => winNextHandler && winNextHandler();
  winAdBtn.onclick = () => winAdHandler && winAdHandler();

  return {
    canvas,

    setCoins(v) {
      coinCount.textContent = v;
    },

    setLevel(n) {
      levelText.textContent = `Level ${n}`;
    },

    showLoginGate({ title = "Login", message = "" } = {}) {
      loginTitle.textContent = title;
      loginMessage.textContent = message;
      loginGate.style.display = "flex";
    },

    hideLoginGate() {
      loginGate.style.display = "none";
    },

    onLoginClick(fn) {
      loginHandler = fn;
    },

    showWinPopup({ levelNumber }) {
      winTitle.textContent = `Level ${levelNumber} complete`;
      winPopup.style.display = "block";
    },

    hideWinPopup() {
      winPopup.style.display = "none";
    },

    onWinNext(fn) {
      winNextHandler = fn;
    },

    onWinAd(fn) {
      winAdHandler = fn;
    },

    onFirstUserGesture(fn) {
      document.body.addEventListener("pointerdown", fn, { once: true });
    },
  };
}