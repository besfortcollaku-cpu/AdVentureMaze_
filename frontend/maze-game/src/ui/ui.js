// src/ui/ui.js
export function mountUI(root) {
  root.innerHTML = `
    <div class="app">
      <header class="top">
        <h1 id="levelText">Level 1</h1>
      </header>

      <div class="hud">
        <button class="icon">👤</button>
        <button class="icon">⚙️</button>
        <button class="icon">☰</button>
        <div class="coins">
          <span id="coinCount">0</span>
        </div>
      </div>

      <div class="boardWrap">
        <canvas id="game"></canvas>
      </div>

      <footer class="bottom">
        <button>❓ Hint</button>
        <span>Swipe to move</span>
        <button>⏭ Skip</button>
      </footer>

      <div class="ad">Ad Banner</div>
    </div>
  `;

  const canvas = root.querySelector("#game");
  const levelText = root.querySelector("#levelText");
  const coinCount = root.querySelector("#coinCount");

  return {
    canvas,
    setLevel(n) {
      levelText.textContent = `Level ${n}`;
    },
    setCoins(n) {
      coinCount.textContent = n;
    },
  };
}