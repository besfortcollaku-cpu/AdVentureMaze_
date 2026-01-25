export function mountUI(app) {
  app.innerHTML = `
    <div class="phone">

      <!-- TOP BAR -->
      <div class="topBar">
        <div class="levelText">Level 1</div>

        <div class="topRow">
          <div class="iconRow">
            <button class="iconBtn">👤</button>
            <button class="iconBtn">⚙️</button>
            <button class="iconBtn">☰</button>
          </div>

          <div class="coinBox">
            🟡 <span class="coinCount">2860</span>
          </div>
        </div>
      </div>

      <!-- GAME AREA -->
      <div class="gameArea">
        <div class="boardFrame">
          <canvas id="game"></canvas>
        </div>
      </div>

      <!-- BOTTOM BAR -->
      <div class="bottomBar">
        <button class="bottomBtn">❓ Hint</button>
        <div class="swipeText">Swipe to move</div>
        <button class="bottomBtn">⏭ Skip</button>
      </div>

      <!-- AD BAR -->
      <div class="adBar">
        Ad Banner
      </div>

    </div>
  `;

  return {
    canvas: document.getElementById("game")
  };
}