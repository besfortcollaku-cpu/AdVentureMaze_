import "../css/theme.css";
import { setTheme } from "../theme.js";

export function mountThemeUI(root) {
  const overlay = document.createElement("div");
  overlay.id = "themeOverlay";
overlay.className = "themeOverlay";

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

  root.appendChild(overlay);
  
  const closeBtn = overlay.querySelector(".theme-close");
  const items = overlay.querySelectorAll(".theme-item");

items.forEach((btn) => {
  btn.addEventListener("click", () => {
    const value = btn.dataset.theme;
    setTheme(value);
  });
});



  closeBtn.onclick = () => {
  };
function open() {
  document.body.classList.add("overlay-open");
  overlay.style.display = "flex";
}

function close() {
  document.body.classList.remove("overlay-open");
  overlay.style.display = "none";
}

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