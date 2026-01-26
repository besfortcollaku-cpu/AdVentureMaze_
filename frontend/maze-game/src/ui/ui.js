// src/ui/ui.js
export function mountUI(app) {
  app.innerHTML = `
    <div class="phone">
      <div class="topbar">
        <div class="topRow">
          <div class="levelWrap">
            <div class="levelText" id="levelText">Level 1</div>
          </div>
        </div>

        <div class="secondRow">
          <div class="iconRow">
            <button class="iconBtn" id="accountBtn" type="button" aria-label="Account">👤</button>
            <button class="iconBtn" id="settingsBtn" type="button" aria-label="Settings">⚙️</button>
            <button class="iconBtn" id="controls" type="button" aria-label="Levels">≡</button>
          </div>

          <div class="coins" title="Coins">
            <div class="coinDot"></div>
            <div id="coinCount">0</div>
          </div>
        </div>
      </div>

      <div class="boardWrap">
        <div class="boardFrame">
          <canvas id="game"></canvas>
        </div>
      </div>

      <div class="bottomBar">
        <div class="bottomIcon">
          <button id="hintBtn" class="bottomBtn left" type="button">
            <span class="icon">❓</span><span>Hint</span>
          </button>

          <div class="swipeHint">Swipe to move</div>

          <button id="x3Btn" class="bottomBtn right" type="button">
            <span class="icon">⏭</span><span>Skip</span>
          </button>
        </div>

        <div class="adsbanner" id="adBanner">
          <p>Ad Banner</p>
        </div>
      </div>
    </div>
  `;

  const levelTextEl = document.getElementById("levelText");
  const coinCountEl = document.getElementById("coinCount");
  const hintBtn = document.getElementById("hintBtn");
  const skipBtn = document.getElementById("x3Btn");
  const canvas = document.getElementById("game");

  let hintHandler = null;
  let skipHandler = null;

  hintBtn?.addEventListener("click", () => hintHandler?.());
  skipBtn?.addEventListener("click", () => skipHandler?.());

  // mobile audio unlock hook (main.js will use this)
  let firstGestureHandler = null;
  window.addEventListener(
    "pointerdown",
    () => {
      firstGestureHandler?.();
      firstGestureHandler = null;
    },
    { once: true }
  );

  function setLevel(n) {
    if (levelTextEl) levelTextEl.textContent = `Level ${n}`;
  }

  function setCoins(n) {
    if (coinCountEl) coinCountEl.textContent = String(n ?? 0);
  }

  return {
    canvas,
    setLevel,
    setCoins,
    onHint(fn) {
      hintHandler = fn;
    },
    onSkip(fn) {
      skipHandler = fn;
    },
    onFirstUserGesture(fn) {
      firstGestureHandler = fn;
    },
  };
}