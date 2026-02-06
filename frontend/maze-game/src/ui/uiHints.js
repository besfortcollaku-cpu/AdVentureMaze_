import { apiMe, apiHint } from "../api.js";

export function openHintPopup(onHintUnlocked) {
  const overlay = document.createElement("div");
  overlay.className = "popup-overlay";

  const popup = document.createElement("div");
  popup.className = "popup";

  apiMe().then(me => {
    popup.innerHTML = `
      <h2>Hint</h2>
      <p>Free hints left: <b>${me.free.hints_left}</b></p>

      <button id="hint-free">Use free hint</button>
      <button id="hint-coins">Spend 50 coins</button>
      <button id="hint-ad">Watch ad (free)</button>
      <button id="hint-cancel">Cancel</button>
    `;

    popup.querySelector("#hint-free").onclick = async () => {
      await apiHint("free");
      close();
      onHintUnlocked?.();
    };

    popup.querySelector("#hint-coins").onclick = async () => {
      await apiHint("coins");
      close();
      onHintUnlocked?.();
    };

    popup.querySelector("#hint-ad").onclick = async () => {
      await apiHint("ad", crypto.randomUUID());
      close();
      onHintUnlocked?.();
    };

    popup.querySelector("#hint-cancel").onclick = close;
  });

  function close() {
    overlay.remove();
  }

  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}