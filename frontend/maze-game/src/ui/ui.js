// src/ui/ui.js

export function mountUI(root) {
  root.innerHTML = `
    <div class="appRoot">
      <!-- TOP BAR -->
      <div class="topBar">
        <div class="levelText" id="levelText">Level 1</div>

        <div class="topButtons">
          <button class="iconBtn" id="btnUser">👤</button>
          <button class="iconBtn" id="btnSettings">⚙️</button>
          <button class="iconBtn" id="btnLevels">≡</button>

          <div class="coins">
            🟡 <span id="coinText">0</span>
          </div>
        </div>
      </div>

      <!-- GAME BOARD -->
      <div class="boardWrap">
        <canvas id="game"></canvas>
      </div>

      <!-- BOTTOM BAR -->
      <div class="bottomBar">
        <button class="pillBtn">❓ Hint</button>
        <div class="hintText">Swipe to move</div>
        <button class="pillBtn">⏭ Skip</button>
      </div>

      <!-- AD -->
      <div class="adBanner">
        Ad Banner
      </div>
    </div>
  `;

  const canvas = root.querySelector("#game");
  const levelText = root.querySelector("#levelText");
  const coinText = root.querySelector("#coinText");

  // --- PUBLIC API (UI ONLY) ---
  return {
    canvas,

    setLevel(n) {
      levelText.textContent = `Level ${n}`;
    },

    setCoins(n) {
      coinText.textContent = n;
    }
  };
}