// src/ui/ui.js

export function mountUI(root) {
  root.innerHTML = `
    <div class="gameWrap">

      <div class="header">
        <div class="levelText" id="levelText">Level 1</div>
      </div>

      <div class="topBar">
        <button class="iconBtn" id="userBtn">👤</button>
        <button class="iconBtn" id="settingsBtn">⚙️</button>
        <button class="iconBtn" id="menuBtn">☰</button>

        <div class="coinPill">
          <span class="coinIcon">🟡</span>
          <span id="coinCount">0</span>
        </div>
      </div>

      <div class="boardWrap">
        <canvas id="game"></canvas>
      </div>

      <div class="bottomBar">
        <button class="hintBtn">❓ Hint</button>
        <div class="swipeText">Swipe to move</div>
        <button class="skipBtn">⏭ Skip</button>
      </div>

      <div class="adBanner">
        Ad Banner
      </div>

    </div>
  `;

const confirmOverlay = document.createElement("div");
confirmOverlay.className = "confirmOverlay hidden";
confirmOverlay.innerHTML = `
  <div class="confirmBox">
    <div class="confirmTitle">Quit game?</div>
    <div class="confirmText">
      Your progress in this level will be lost.
    </div>
    <div class="confirmActions">
      <button id="confirmCancel">Cancel</button>
      <button id="confirmOk">Quit</button>
    </div>
  </div>
`;
app.appendChild(confirmOverlay);
let confirmResolver = null;

function showConfirmQuit() {
  confirmOverlay.classList.remove("hidden");

  return new Promise((resolve) => {
    confirmResolver = resolve;
  });
}

document.getElementById("confirmCancel").onclick = () => {
  confirmOverlay.classList.add("hidden");
  confirmResolver(false);
};

document.getElementById("confirmOk").onclick = () => {
  confirmOverlay.classList.add("hidden");
  confirmResolver(true);
};
  const canvas = root.querySelector("#game");

  return {
    canvas,

    setLevel(n) {
      const el = root.querySelector("#levelText");
      if (el) el.textContent = `Level ${n}`;
    },

    setCoins(n) {
      const el = root.querySelector("#coinCount");
      if (el) el.textContent = n;
    },

    onFirstUserGesture(fn) {
      const handler = () => {
        fn();
        window.removeEventListener("pointerdown", handler);
      };
      window.addEventListener("pointerdown", handler);
    },
  };

  // ---------------------------
  // BOARD (CANVAS HOLDER)
  // ---------------------------
  const boardWrap = document.createElement("div");
  boardWrap.className = "boardWrap";
const welcome = document.createElement("div");
welcome.id = "welcomeOverlay";
welcome.innerHTML = `
  <div class="welcomeCard">
    <h1>Adventure Maze</h1>

    <button id="guestBtn">Play as Guest</button>
    <button id="loginBtn">Login with Pi</button>
  </div>
`;
app.appendChild(welcome);
let guestHandler = null;
let loginHandler = null;

welcome.querySelector("#guestBtn").onclick = () => {
  guestHandler?.();
};

welcome.querySelector("#loginBtn").onclick = () => {
  loginHandler?.();
};

  // ---------------------------
  // FOOTER
  // ---------------------------
  const footer = document.createElement("div");
  footer.className = "footer";

  footer.innerHTML = `
    <button class="footerBtn hintBtn">❓ Hint</button>
    <div class="footerText">Swipe to move</div>
    <button class="footerBtn skipBtn">⏭ Skip</button>
  `;

  // ---------------------------
  // AD BANNER
  // ---------------------------
  const adBanner = document.createElement("div");
  adBanner.className = "adBanner";
  adBanner.textContent = "Ad Banner";

  // ---------------------------
  // ASSEMBLE
  // ---------------------------
  app.appendChild(header);
  app.appendChild(boardWrap);
  app.appendChild(footer);
  app.appendChild(adBanner);

  root.appendChild(app);

  // ---------------------------
  // RETURN UI API
  // ---------------------------
  // ---------------------------
// RETURN UI API
// ---------------------------
return {
  canvas,

  // ---- Welcome overlay ----
  showWelcome() {
    welcome.style.display = "flex";
  },

  hideWelcome() {
    welcome.style.display = "none";
  },

  onGuestStart(cb) {
    guestHandler = cb;
  },

  onLoginClick(cb) {
    loginHandler = cb;
  },

  // ---- Quit confirm (toast / modal handler) ----
  showConfirmQuit,

  // ---- Game UI stubs (safe no-ops for now) ----
  setLevel() {},
  setUser() {},
  setCoins() {},

  // ---- First interaction (audio unlock etc.) ----
  onFirstUserGesture(cb) {
    const handler = () => {
      window.removeEventListener("pointerdown", handler);
      cb?.();
    };
    window.addEventListener("pointerdown", handler);
  }
};
}