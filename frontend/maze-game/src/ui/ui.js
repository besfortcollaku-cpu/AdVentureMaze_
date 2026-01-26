// src/ui/ui.js

export function mountUI(root) {
  // Clear root safely
  root.innerHTML = "";

  // ---------------------------
  // APP WRAPPER
  // ---------------------------
  const app = document.createElement("div");
  app.className = "app";

  // ---------------------------
  // HEADER
  // ---------------------------
  const header = document.createElement("div");
  header.className = "header";

  header.innerHTML = `
    <div class="levelTitle">Level 1</div>
    <div class="headerRow">
      <button class="iconBtn userBtn"></button>
      <button class="iconBtn settingsBtn"></button>
      <button class="iconBtn menuBtn"></button>
      <div class="coinPill">
        <span class="coinIcon"></span>
        <span id="coinCount">0</span>
      </div>
    </div>
  `;

  // ---------------------------
  // BOARD (CANVAS HOLDER)
  // ---------------------------
  const boardWrap = document.createElement("div");
  boardWrap.className = "boardWrap";

  const canvas = document.createElement("canvas");
  canvas.id = "game";
  boardWrap.appendChild(canvas);

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