// src/ui/ui.js

export function mountUI(root) {
  root.innerHTML = `
    <div class="appShell">
      <header class="top">
        <h1 class="level" id="levelText">Level 1</h1>

        <div class="icons">
          <button class="icon" id="accountBtn">👤</button>
          <button class="icon" id="settingsBtn">⚙️</button>
          <button class="icon" id="levelsBtn">☰</button>
        </div>

        <div class="coins">🟡 <span id="coinCount">0</span></div>
      </header>

      <div class="board">
        <canvas id="game"></canvas>
      </div>

      <div class="bottom">
        <div class="hint">Swipe to move</div>
      </div>
    </div>

    <!-- Welcome overlay -->
    <div class="welcomeOverlay" id="welcomeOverlay" aria-hidden="false">
      <div class="welcomeCard">
        <h2 class="welcomeTitle">Adventure Maze</h2>

        <button id="guestBtn" class="startBtn">Play as Guest</button>
        <button id="loginBtn" class="startBtn secondary">Login with Pi</button>

        <div id="loginError" class="loginError"></div>
      </div>
    </div>
  `;

  const canvas = root.querySelector("#game");
  const welcome = root.querySelector("#welcomeOverlay");
  const guestBtn = root.querySelector("#guestBtn");
  const loginBtn = root.querySelector("#loginBtn");
  const loginError = root.querySelector("#loginError");
  const coinCountEl = root.querySelector("#coinCount");
  const levelTextEl = root.querySelector("#levelText");

  let guestHandler = null;
  let loginHandler = null;
  let firstGestureHandler = null;

  guestBtn?.addEventListener("click", () => guestHandler?.());
  loginBtn?.addEventListener("click", () => loginHandler?.());

  function showWelcome() {
    if (!welcome) return;
    welcome.style.display = "flex";
    welcome.setAttribute("aria-hidden", "false");
  }

  function hideWelcome() {
    if (!welcome) return;
    welcome.style.display = "none";
    welcome.setAttribute("aria-hidden", "true");
  }

  function showLoginError(msg) {
    if (!loginError) return;
    loginError.textContent = msg ? String(msg) : "";
  }

  // first user gesture hook (audio unlock etc.)
  window.addEventListener(
    "pointerdown",
    () => {
      firstGestureHandler?.();
      firstGestureHandler = null;
    },
    { once: true }
  );

  return {
    canvas,

    // welcome
    showWelcome,
    hideWelcome,
    showLoginError,
    onGuestStart(cb) {
      guestHandler = cb;
    },
    onLoginClick(cb) {
      loginHandler = cb;
    },

    // UI updates (safe)
    setCoins(n) {
      if (coinCountEl) coinCountEl.textContent = String(n ?? 0);
    },
    setLevel(n) {
      if (levelTextEl) levelTextEl.textContent = `Level ${n}`;
    },
    onFirstUserGesture(cb) {
      firstGestureHandler = cb;
    },

    // keep compatibility (don’t downgrade other code)
    setUser() {},
  };
}