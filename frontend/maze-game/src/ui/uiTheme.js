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

document.body.appendChild(el);

  const closeBtn = overlay.querySelector(".theme-close");

  closeBtn.onclick = () => {
    overlay.classList.add("hidden");
  };

  return {
    open() {
      overlay.classList.remove("hidden");
    },
    close() {
      overlay.classList.add("hidden");
    },
  };
}