
import { useSkip, useHint } from "./main.js";

export function updateCoinsUI(coins) {
  const el = document.getElementById("coinCount");
  if (el) el.textContent = coins;
}

document.addEventListener("DOMContentLoaded", () => {
  const skipBtn = document.getElementById("btnSkip");
  const hintBtn = document.getElementById("btnHint");

  if (skipBtn) {
    skipBtn.onclick = async () => {
      try {
        await useSkip();
      } catch (e) {
        alert(e.message || e);
      }
    };
  }

  if (hintBtn) {
    hintBtn.onclick = async () => {
      try {
        await useHint();
      } catch (e) {
        alert(e.message || e);
      }
    };
  }
});
