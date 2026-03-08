export function createMissedRewardPopup() {

  const overlay = document.createElement("div");
  overlay.className = "daily-overlay hidden";

  overlay.innerHTML = `
    <div class="daily-box">
      <h2>Missed Reward</h2>

      <div class="daily-text">
        You missed <b id="missedDay"></b><br>
        <span id="missedCoins"></span> coins
      </div>

      <div class="daily-buttons">
        <button id="recoverBtn">Recover via Ad</button>
        <button id="ignoreBtn">Ignore</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const dayEl = overlay.querySelector("#missedDay");
  const coinsEl = overlay.querySelector("#missedCoins");
  const recoverBtn = overlay.querySelector("#recoverBtn");
  const ignoreBtn = overlay.querySelector("#ignoreBtn");

  let recoverHandler = null;

  recoverBtn.onclick = () => recoverHandler?.();
  ignoreBtn.onclick = () => overlay.classList.add("hidden");

  return {

    show({ day, coins }) {
      dayEl.textContent = `Day ${day}`;
      coinsEl.textContent = `${coins}`;
      overlay.classList.remove("hidden");
    },

    hide() {
      overlay.classList.add("hidden");
    },

    onRecover(fn) {
      recoverHandler = fn;
    }

  };
}