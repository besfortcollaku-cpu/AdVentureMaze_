export function createMysteryChestPopup(){

  const overlay = document.createElement("div");
  overlay.className = "daily-overlay hidden";

  overlay.innerHTML = `
  <div class="daily-box chest-box">

    <h2>Perfect Week!</h2>

    <div id="chestClosed" class="chest-icon">
      🎁
    </div>

    <div id="chestOpen" class="chest-open hidden">
      <div class="spin">✨</div>
      <div id="rewardCoins" class="reward-coins"></div>
    </div>

    <button id="openChest">Open Chest</button>

  </div>
`;
  document.body.appendChild(overlay);

  const btn = overlay.querySelector("#openChest");
  const chestClosed = overlay.querySelector("#chestClosed");
const chestOpen = overlay.querySelector("#chestOpen");
const rewardCoins = overlay.querySelector("#rewardCoins");

  let handler = null;

btn.onclick = async () => {

  btn.disabled = true;

  chestClosed.classList.add("hidden");
  chestOpen.classList.remove("hidden");

  const reward = await handler?.();

  if (reward) {
    rewardCoins.textContent = `+${reward} coins`;
  }

};
  return {

    show(){ overlay.classList.remove("hidden"); },

    hide(){ overlay.classList.add("hidden"); },

    onOpen(fn){ handler = fn; }

  };
}