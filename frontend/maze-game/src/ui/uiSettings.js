
import "../css/settings.css";


export function mountSettingsUI(root) {
  const el = document.createElement("div");
  el.id = "settingsOverlay";
  el.className = "settings-overlay hidden";

  el.innerHTML = `
    <div class="settings-backdrop"></div>
    <div class="settings-card">
      <div class="settings-header">
        <h2>Settings</h2>
        <button class="close-btn">✕</button>
      </div>

      <div class="settings-item">
        <div>
          <strong>Sound</strong>
          <div class="desc">Rolling + victory (no wall-hit sound)</div>
        </div>
        <label class="switch">
          <input type="checkbox" id="soundToggle">
          <span class="slider"></span>
        </label>
      </div>

      <div class="settings-item">
        <div>
          <strong>Vibration</strong>
          <div class="desc">Small vibration when ball stops</div>
        </div>
        <label class="switch">
          <input type="checkbox" id="vibrationToggle">
          <span class="slider"></span>
        </label>
      </div>

      <!-- FUTURE -->
      <div class="settings-item disabled">
        <div>
          <strong>Background music</strong>
          <div class="desc">Coming soon</div>
        </div>
        <label class="switch">
          <input type="checkbox" disabled>
          <span class="slider"></span>
        </label>
      </div>

      <p class="settings-hint">Changes are saved automatically.</p>
    </div>
  `;

  root.appendChild(el);

  const soundToggle = el.querySelector("#soundToggle");
  const vibrationToggle = el.querySelector("#vibrationToggle");

  // ---- LOAD SAVED SETTINGS ----
  soundToggle.checked = localStorage.getItem("sound") !== "off";
  vibrationToggle.checked = localStorage.getItem("vibration") !== "off";

  // ---- SAVE ON CHANGE ----
  soundToggle.addEventListener("change", () => {
    localStorage.setItem("sound", soundToggle.checked ? "on" : "off");
  });

  vibrationToggle.addEventListener("change", () => {
    localStorage.setItem("vibration", vibrationToggle.checked ? "on" : "off");
  });

  // ---- OPEN / CLOSE ----
  el.querySelector(".close-btn").onclick = close;
  el.querySelector(".settings-backdrop").onclick = close;

  function open() {
    el.classList.remove("hidden");
    document.body.classList.add("modal-open");
  }

  function close() {
    el.classList.add("hidden");
    document.body.classList.remove("modal-open");
  }

  return { open, close };
}