import { apiMe, apiSkip } from "../api.js";

export function openSkipPopup(onSkipSuccess) {
  const overlay = document.createElement("div");
  overlay.className = "popup-overlay";

  const popup = document.createElement("div");
  popup.className = "popup";

  apiMe().then(me => {
    popup.innerHTML = `
      <h2>Skip Level</h2>
      <p>Free skips left: <b>${me.free.skips_left}</b></p>

      <button id="skip-free">Use free skip</button>
      <button id="skip-coins">Spend 50 coins</button>
      <button id="skip-ad">Watch ad (free)</button>
      <button id="skip-cancel">Cancel</button>
    `;

    popup.querySelector("#skip-free").onclick = async () => {
      await apiSkip("free");
      close();
      onSkipSuccess?.();
    };

    popup.querySelector("#skip-coins").onclick = async () => {
      await apiSkip("coins");
      close();
      onSkipSuccess?.();
    };

    popup.querySelector("#skip-ad").onclick = async () => {
      await apiSkip("ad", crypto.randomUUID());
      close();
      onSkipSuccess?.();
    };

    popup.querySelector("#skip-cancel").onclick = close;
  });

  function close() {
    overlay.remove();
  }

  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}