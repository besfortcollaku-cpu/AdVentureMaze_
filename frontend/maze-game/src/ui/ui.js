// src/ui/ui.js
export function mountUI(app) {
  app.innerHTML = `
    <div id="gameUI">
      <div class="topbar">
        <div class="coins">
          <span id="coinCount">0</span>
        </div>
        <button id="controls">☰</button>
      </div>

      <canvas id="gameCanvas"></canvas>

      <div class="actions">
        <button id="hintBtn">Hint</button>
        <button id="x3Btn">Skip</button>
      </div>

      <div id="winPopup" class="hidden">
        <button id="winNextBtn">Next</button>
        <button id="winAdBtn">Watch Ad</button>
      </div>

      <div id="levelSelect" class="hidden"></div>
    </div>

    <div id="bootOverlay" class="overlay hidden">
      <div class="spinner"></div>
      <div id="bootText">Tap to continue</div>
    </div>

    <div id="welcomeOverlay" class="overlay hidden">
      <div class="welcome">
        <h1>Welcome</h1>
        <button id="welcomeContinue">Tap anywhere to start</button>
      </div>
    </div>
  `;

  const ui = {
    canvas: document.getElementById("gameCanvas"),

    // ---------- overlays ----------
    showBootOverlay(text) {
      const el = document.getElementById("bootOverlay");
      el.classList.remove("hidden");
      if (text) document.getElementById("bootText").textContent = text;
    },
    hideBootOverlay() {
      document.getElementById("bootOverlay").classList.add("hidden");
    },
    showWelcomeScreen() {
      document.getElementById("welcomeOverlay").classList.remove("hidden");
    },
    hideWelcomeScreen() {
      document.getElementById("welcomeOverlay").classList.add("hidden");
    },

    // ---------- coins ----------
    setCoins(v) {
      document.getElementById("coinCount").textContent = v;
    },

    // ---------- events ----------
    onFirstUserGesture(fn) {
      document.getElementById("bootOverlay")
        .addEventListener("pointerdown", fn, { once: true });
    },

    onLoginGateClick(fn) {
      document.getElementById("bootOverlay")
        .addEventListener("pointerdown", fn);
    },

    onWelcomeContinue(fn) {
      document.getElementById("welcomeContinue")
        .addEventListener("click", fn);
    },

    onWinNext(fn) {
      document.getElementById("winNextBtn").onclick = fn;
    },

    onWinAd(fn) {
      document.getElementById("winAdBtn").onclick = fn;
    },

    showWinPopup() {
      document.getElementById("winPopup").classList.remove("hidden");
    },

    hideWinPopup() {
      document.getElementById("winPopup").classList.add("hidden");
    },

    showLevelSelect(cfg) {
      document.getElementById("levelSelect").classList.remove("hidden");
    },

    onLevelSelect(fn) {
      // existing logic preserved
    },

    onSoundToggle() {},
    onVibrationToggle() {},
    setSoundEnabled() {},
    setVibrationEnabled() {},
  };

  return ui;
}