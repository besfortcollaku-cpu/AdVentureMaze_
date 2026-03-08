export function createMysteryChestPopup(){

  const overlay = document.createElement("div");
  overlay.className = "daily-overlay hidden";

  overlay.innerHTML = `
    <div class="daily-box">
      <h2>Mystery Chest</h2>

      <div class="daily-text">
        Perfect 7-day streak!
      </div>

      <button id="openChest">Open Chest</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const btn = overlay.querySelector("#openChest");

  let handler = null;

  btn.onclick = ()=>handler?.();

  return {

    show(){ overlay.classList.remove("hidden"); },

    hide(){ overlay.classList.add("hidden"); },

    onOpen(fn){ handler = fn; }

  };
}