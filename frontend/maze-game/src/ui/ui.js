import { mountAccountUI } from "./uiAccount.js";
import { mountSettingsUI } from "./uiSettings.js";

// NOTE: Hint/Skip popups are now controlled from src/main.js so
// they can call the backend (free/coins/ad) and update the game.
import { mountLevelsUI } from "./uiLevels.js"; 
export function mountUI(root) {
  root.innerHTML = `
    <div id="app" class="app">
      <header class="top">
        <h1 class="level">Level 1</h1>
        <div class="icons">
          <button class="icon" id="accountBtn">👤</button>
          <button class="icon" id="settingsBtn">⚙️</button>
          <button class="icon" id="levelsBtn">☰</button>
          <div class="btn-wrapper">
  <button id="restartBtn" class="icon">🔄</button>
  <span class="badge" id="restartCount">63</span>
</div>
        </div>
        <div class="coins">
          <span id="userName" class="userName">Guest</span>
          🪙 <span id="coinCount">0</span>
        </div>
      </header>

      <div class="board">
        <canvas id="game"></canvas>
      </div>

      <footer class="bottom">
       <div class="btn-wrapper">
  <button id="hintBtn" class="icon">❓</button>
  <span class="badge" id="hintCount">5</span>
</div>
        <span>Swipe to move</span>
       <div class="btn-wrapper">
  <button id="skipBtn" class="icon">⏭</button>
  <span class="badge" id="skipCount">2</span>
</div>
      </footer>

      <div class="ad">Ad Banner</div>

      <div id="welcomeOverlay" class="welcomeOverlay">
        <div class="welcomeCard">
          <h1>Welcome to AdVenture Maze</h1>
          <button id="loginBtn" class="startBtn secondary">Login with Pi</button>
          <button id="guestBtn" class="startBtn">Play as Guest</button>
        </div>
      </div>
    </div>
     `;
    
    
    // ===== Login Required Overlay =====
const loginRequiredOverlay = document.createElement("div");
loginRequiredOverlay.className = "login-required-overlay hidden";

loginRequiredOverlay.innerHTML = `
  <div class="login-required-card">
    <h2>Login required</h2>
    <p>You need to login to use this feature.</p>

    <div class="login-required-actions">
      <button class="login-btn">Login</button>
      <button class="cancel-btn">Stay Guest</button>
    </div>
  </div>
`;

root.appendChild(loginRequiredOverlay);

const loginReqLoginBtn =
  loginRequiredOverlay.querySelector(".login-btn");
const loginReqCancelBtn =
  loginRequiredOverlay.querySelector(".cancel-btn");

loginReqCancelBtn.onclick = () => {
  loginRequiredOverlay.classList.add("hidden");
};

loginReqLoginBtn.onclick = () => {
  // close login-required popup
  loginRequiredOverlay.classList.add("hidden");

  // FORCE welcome overlay exactly like app start
  welcome.style.display = "flex";
  document.body.classList.add("welcome-visible");
  document.body.classList.remove("game-running");
};


  // ----- CORE ELEMENTS -----
  const canvas = root.querySelector("#game");
  const welcome = root.querySelector("#welcomeOverlay");
  const guestBtn = root.querySelector("#guestBtn");
  const loginBtn = root.querySelector("#loginBtn");
  const levelsBtn = root.querySelector("#levelsBtn");
  const accountBtn = root.querySelector("#accountBtn");
  const settingsBtn = root.querySelector("#settingsBtn");
  const restartBtn = root.querySelector("#restartBtn");
  const hintBtn = root.querySelector("#hintBtn");
  const skipBtn = root.querySelector("#skipBtn");

  // ----- ACCOUNT UI -----
  const accountUI = mountAccountUI(root);
  let accountClickHandler = null;

accountBtn.addEventListener("click", () => {
  if (accountClickHandler) {
    accountClickHandler();
  } else {
    accountUI.show();
  }
});

  // ----- SETTINGS UI -----
  const settingsUI = mountSettingsUI(root);
  settingsBtn.addEventListener("click", () => {
    settingsUI.open();
  });

  // Hint/Skip clicks are wired up by main.js

  // ----- HANDLERS -----
  let guestHandler = null;
  let loginHandler = null;
let onHintClick = () => {};
let onSkipClick = () => {};

let onRestartClick = () => {};
restartBtn.addEventListener("click", () => onRestartClick());

hintBtn.addEventListener("click", () => onHintClick());
skipBtn.addEventListener("click", () => onSkipClick());

  guestBtn.addEventListener("click", () => {
    guestHandler?.();
  });

  loginBtn.addEventListener("click", async () => {
    loginHandler?.();
  });
  


  // ----- iOS EDGE GUARDS -----
  const leftGuard = document.createElement("div");
  leftGuard.className = "edge-guard left";

  const rightGuard = document.createElement("div");
  rightGuard.className = "edge-guard right";

  document.body.appendChild(leftGuard);
  document.body.appendChild(rightGuard);

  // ----- PUBLIC API -----
  return {
      
      
      showLoginRequired() {
  loginRequiredOverlay.classList.remove("hidden");
},
hideLoginRequired() {
  loginRequiredOverlay.classList.add("hidden");
},
    canvas,
    levelsBtn,
    hintBtn,
    skipBtn,
    onHintClick(fn) {
    onHintClick = fn;
  },
  onRestartClick(fn) {
  onRestartClick = fn;
},

  onSkipClick(fn) {
    onSkipClick = fn;
  },
    showLoginGate() {
  this.showWelcome();
},
onAccountClick(cb) {
  accountClickHandler = cb;
},
hideLoginGate() {
  this.hideWelcome();
},

showLoginError(msg) {
  alert(msg); // TEMP – replace later with UI label
},

    showWelcome() {
      document.body.classList.remove("game-running");
      document.body.classList.add("welcome-visible");
      welcome.style.display = "flex";
    },

    hideWelcome() {
      document.body.classList.remove("welcome-visible");
      welcome.style.display = "none";
    },

    onLoginClick(cb) {
      loginHandler = cb;
    },
triggerLogin() {
  loginHandler?.();
},
    onGuestStart(cb) {
      guestHandler = cb;
    },

    onFirstUserGesture(cb) {
      const handler = () => {
        window.removeEventListener("pointerdown", handler);
        cb?.();
      };
      window.addEventListener("pointerdown", handler);
    },

    // ---- DATA BINDINGS ----
    setUser(user) {
      const el = document.getElementById("userName");
      if (el) el.textContent = (user && (user.username || user.uid)) || "Guest";
      accountUI.setUser(user);
    },

    setCoins(count) {
      const coinEl = document.getElementById("coinCount");
      if (coinEl) coinEl.textContent = count ?? 0;
      accountUI.setCoins(count);
    },

    // ---- STUBS (KEEP) ----
    setLevel(levelNumber) {
      const el = root.querySelector(".top .level");
      if (el) el.textContent = `Level ${levelNumber}`;
    },
  };
}