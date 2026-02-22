import "../css/theme.css";
import { setTheme } from "../theme.js";

export function mountThemeUI(root) {
  const overlay = document.createElement("div");
  overlay.className = "theme-overlay hidden";

  overlay.innerHTML = `
    <div class="theme-card">
      <h2>Select Theme</h2>
      <div class="theme-list">
        <button class="theme-item" data-theme="ice">❄️ Ice</button>
        <button class="theme-item" data-theme="forest">🌿 Forest</button>
        <button class="theme-item" data-theme="lava">🔥 Lava</button>
      </div>
      <button class="theme-close">Close</button>
    </div>
  `;

  document.body.appendChild(overlay);
  
  const closeBtn = overlay.querySelector(".theme-close");
  const items = overlay.querySelectorAll(".theme-item");

items.forEach((btn) => {
  btn.addEventListener("click", () => {
    const value = btn.dataset.theme;
    setTheme(value);
    overlay.classList.add("hidden");
  });
});



  closeBtn.onclick = () => {
  overlay.style.opacity = "0";
  setTimeout(() => {
    overlay.classList.add("hidden");
  }, 250);
};

  return {
    open() {
overlay.classList.remove("hidden");
  requestAnimationFrame(() => {
    overlay.style.opacity = "1";
  });    },
    close() {
overlay.style.opacity = "0";
  setTimeout(() => {
    overlay.classList.add("hidden");
  }, 250);    },
  };
}