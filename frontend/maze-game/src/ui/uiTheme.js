import "../css/theme.css";
import { setTheme } from "../theme.js";

export function mountThemeUI(root) {
  const overlay = document.createElement("div");
  overlay.className = "theme-overlay";
overlay.classList.remove("active");   // force closed state

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
    overlay.classList.remove("active");
  });
});



  closeBtn.onclick = () => {
    overlay.classList.remove("active");
  };

  return {
    open() {
  overlay.classList.add("active");
},
close() {
  overlay.classList.remove("active");
},
  };
}