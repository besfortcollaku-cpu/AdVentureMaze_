// src/ui/ui.js

export function mountUI(app) {
  app.innerHTML = `
    <div id="bootOverlay" class="overlay"></div>
    <div id="welcomeScreen" class="welcome hidden"></div>
    <canvas id="gameCanvas"></canvas>
  `;

  const bootOverlay = document.getElementById("bootOverlay");
  const welcomeScreen = document.getElementById("welcomeScreen");
  const canvas = document.getElementById("gameCanvas");

  let loginGateHandler = null;
  let welcomeContinueHandler = null;

  // ---------------------------
  // Boot overlay
  // ---------------------------
  function showBootOverlay(text) {
    bootOverlay.innerHTML = `<div class="spinner"></div><div>${text}</div>`;
    bootOverlay.classList.add("active");
  }

  function hideBootOverlay() {
    bootOverlay.classList.remove("active");
  }

  bootOverlay.addEventListener("pointerdown", () => {
    loginGateHandler?.();
  });

  showBootOverlay("Tap to continue");

  // ---------------------------
  // Welcome screen
  // ---------------------------
  function showWelcomeScreen() {
    hideBootOverlay();
    welcomeScreen.innerHTML = `
      <div class="card">
        <h2>Welcome</h2>
        <p>Guide the ball through the maze.<br/>Tap anywhere to start</p>
      </div>
    `;
    welcomeScreen.classList.remove("hidden");
  }

  function hideWelcomeScreen() {
    welcomeScreen.classList.add("hidden");
  }

  welcomeScreen.addEventListener("pointerdown", () => {
    welcomeContinueHandler?.();
  });

  // ---------------------------
  // API
  // ---------------------------
  return {
    canvas,

    showBootOverlay,
    hideBootOverlay,

    showWelcomeScreen,
    hideWelcomeScreen,

    onLoginGateClick(fn) {
      loginGateHandler = fn;
    },

    onWelcomeContinue(fn) {
      welcomeContinueHandler = fn;
    },

    setCoins() {},
    setUser() {},
    onFirstUserGesture(fn) {
      window.addEventListener("pointerdown", fn, { once: true });
    },

    setSoundEnabled() {},
    setVibrationEnabled() {},
    onSoundToggle() {},
    onVibrationToggle() {},
    showWinPopup() {},
  };
}