// src/ui/ui.js

export function mountUI(root) {
  root.innerHTML = `
    <div id="app" class="app">
      <header class="top">
        <h1 class="level">Level 1</h1>
        <div class="icons">
          <button class="icon">👤</button>
          <button class="icon">⚙️</button>
          <button class="icon">☰</button>
        </div>
        <div class="coins">🟡 <span id="coinCount">0</span></div>
      </header>

      <div class="board">
        <canvas id="game"></canvas>
      </div>

      <footer class="bottom">
        <button class="btn">❓ Hint</button>
        <span>Swipe to move</span>
        <button class="btn">⏭ Skip</button>
      </footer>

      <div class="ad">Ad Banner</div>

      <div id="welcomeOverlay" class="welcomeOverlay">
  <div class="welcomeCard">
    <h1>Welcome to AdVenture Maze</h1>
    <button id="guestBtn" class="startBtn">Play as Guest</button>
  </div>
</div>
    </div>
  `;

  const canvas = root.querySelector("#game");
  const welcome = root.querySelector("#welcomeOverlay");
  const guestBtn = root.querySelector("#guestBtn");

  let guestHandler = null;

  guestBtn.addEventListener("click", () => {
    guestHandler?.();
  });

  return {
    canvas,

    showWelcome() {
        document.body.classList.remove("game-running");
      welcome.style.display = "flex";
    },

    hideWelcome() {
      welcome.style.display = "none";
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

    // stubs (do not remove)
    setLevel() {},
    setUser() {},
    setCoins() {},
  };
}