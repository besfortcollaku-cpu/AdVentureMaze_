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
    <div class="coins">
  <span id="userName" class="userName">Guest:</span>
  🪙 <span id="coinCount">0</span>
</div>
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
    <button id="loginBtn" class="startBtn secondary">Login with Pi</button>
    <button id="guestBtn" class="startBtn">Play as Guest</button>
  </div>
</div>
    </div>
  `;

  const canvas = root.querySelector("#game");
  const welcome = root.querySelector("#welcomeOverlay");
  const guestBtn = root.querySelector("#guestBtn");
  const loginBtn = root.querySelector("#loginBtn");

  let guestHandler = null;
 let loginHandler = null;


  guestBtn.addEventListener("click", () => {
    guestHandler?.();
  });
  loginBtn.addEventListener("click", () => {
  loginHandler?.();
});
// Edge guards (block iOS back swipe)
const leftGuard = document.createElement("div");
leftGuard.className = "edge-guard left";

const rightGuard = document.createElement("div");
rightGuard.className = "edge-guard right";

document.body.appendChild(leftGuard);
document.body.appendChild(rightGuard);


  return {
    canvas,

    showWelcome() {
        document.body.classList.remove("game-running");
      welcome.style.display = "flex";
    },

    hideWelcome() {
      welcome.style.display = "none";
    },
onLoginClick(cb) {
  loginHandler = cb;
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
    setUser(user) {
  const el = document.getElementById("userName");
  if (!el) {
    console.warn("userName element not found");
    return;
  }

  el.textContent = user?.username || "Guest";
},

    setCoins(count) {
  const coinEl = document.getElementById("coinCount");
  if (coinEl) coinEl.textContent = count ?? 0;
},
  };
}