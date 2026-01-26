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
  return {
    canvas,

    // Stubs (safe no-ops for now)
    setLevel() {},
    setUser() {},
    setCoins() {},
    hideWelcome() {},
    showWelcome() {},
    onGuestStart() {},
    onLoginClick() {},
    onFirstUserGesture(cb) {
      // fire once on first interaction
      const handler = () => {
        window.removeEventListener("pointerdown", handler);
        cb?.();
      };
      window.addEventListener("pointerdown", handler);
    },
  };
}