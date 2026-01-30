import { mountAccountUI } from "./uiAccount.js";
import { mountSettingsUI } from "./uiSettings.js";
import { mountHintsUI } from "./uiHints.js";
import { mountSkipUI } from "./uiSkip.js"; // ✅ NEW
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
        <button class="btn" id="hintBtn">❓ Hint</button>
        <span>Swipe to move</span>
        <button class="btn" id="skipBtn">⏭ Skip</button>
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

  // ----- CORE ELEMENTS -----
  const canvas = root.querySelector("#game");
  const welcome = root.querySelector("#welcomeOverlay");
  const guestBtn = root.querySelector("#guestBtn");
  const loginBtn = root.querySelector("#loginBtn");
  const levelsBtn = root.querySelector("#levelsBtn");
  const accountBtn = root.querySelector("#accountBtn");
  const settingsBtn = root.querySelector("#settingsBtn");
  const hintBtn = root.querySelector("#hintBtn");
  const skipBtn = root.querySelector("#skipBtn"); // ✅ NEW

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

  // ----- HINTS UI -----
  const hintsUI = mountHintsUI(root);
  hintBtn.addEventListener("click", () => {
    hintsUI.open();
  });

  // ----- SKIP UI (NEW) -----
  const skipUI = mountSkipUI(root);
  skipBtn.addEventListener("click", () => {
    skipUI.open();
  });

  // ----- HANDLERS -----
  let guestHandler = null;
  let loginHandler = null;

  guestBtn.addEventListener("click", () => {
    guestHandler?.();
  });

  loginBtn.addEventListener("click", () => {
    ui.onLoginClick(async () => {
  const result = await ensurePiLogin({
    BACKEND,
    ui,
    onLogin: ({ user, accessToken }) => {
      CURRENT_USER = user;
      CURRENT_ACCESS_TOKEN = accessToken;
    },
  });

  if (!result?.ok) return;

  const me = await loadMeAndSyncUI({
    BACKEND,
    token: CURRENT_ACCESS_TOKEN,
    ui,
  });

  levelsUI.setUnlocked?.(
    me?.progress?.maxLevel ?? 1
  );

  document.body.classList.add("game-running");
  ui.hideWelcome?.();
  game.start();
});
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
    canvas,
    levelsBtn,
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
    setLevel() {},
  };
}