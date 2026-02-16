
import "../css/settings.css";
import { getSettings, setSetting, subscribeSettings } from "../settings.js";




export function mountSettingsUI(root) {
  const el = document.createElement("div");
  el.id = "settingsOverlay";
  el.className = "settings-overlay hidden";

  el.innerHTML = `
    <<div class="settings-backdrop"></div>

<div class="settings-card">
  <div class="settings-header">
    <h2>Settings</h2>
    <button class="close-btn">✕</button>
  </div>

  <!-- SOUND -->
  <div class="settings-item">
    <div class="setting-label">
      ${soundSVG()}
      <div>
        <strong>Sound</strong>
        <div class="desc">Rolling + victory (no wall-hit sound)</div>
      </div>
    </div>
    <label class="switch">
      <input type="checkbox" id="soundToggle">
      <span class="slider"></span>
    </label>
  </div>

  <!-- VIBRATION -->
  <div class="settings-item">
    <div class="setting-label">
      ${vibrationSVG()}
      <div>
        <strong>Vibration</strong>
        <div class="desc">Small vibration when ball stops</div>
      </div>
    </div>
    <label class="switch">
      <input type="checkbox" id="vibrationToggle">
      <span class="slider"></span>
    </label>
  </div>

  <!-- GYROSCOPE -->
  <div class="settings-item">
    <div class="setting-label">
      ${gyroSVG()}
      <div>
        <strong>Gyroscope</strong>
        <div class="desc">Tilt phone to move ball</div>
      </div>
    </div>
    <label class="switch">
      <input type="checkbox" id="gyroToggle">
      <span class="slider"></span>
    </label>
  </div>

  <!-- FUTURE / DISABLED -->
  <div class="settings-item disabled">
    <div class="setting-label">
      ${musicSVG()}
      <div>
        <strong>Background music</strong>
        <div class="desc">Coming soon</div>
      </div>
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
const gyroToggle = el.querySelector("#gyroToggle");
  const soundToggle = el.querySelector("#soundToggle");
  const vibrationToggle = el.querySelector("#vibrationToggle");

  // ---- LOAD SAVED SETTINGS ----
  gyroToggle.checked = localStorage.getItem("gyro") === "on";
  // ---- SAVE ON CHANGE ----
  gyroToggle.addEventListener("change", () => {
  localStorage.setItem("gyro", gyroToggle.checked ? "on" : "off");
});
  

// ---- LOAD (from src/settings.js) ----
const s0 = getSettings();
soundToggle.checked = !!s0.sound;
vibrationToggle.checked = !!s0.vibration;

// keep UI in sync if settings change elsewhere
subscribeSettings((s) => {
  soundToggle.checked = !!s.sound;
  vibrationToggle.checked = !!s.vibration;
});

// ---- SAVE ON CHANGE (to src/settings.js) ----
soundToggle.addEventListener("change", async () => {
  const checked = soundToggle.checked;

  // store
  setSetting("sound", checked);

  // 🔑 IMPORTANT: only try unlock when turning sound ON
  if (checked) {
    await ensureAudioUnlocked();
  }
});

vibrationToggle.addEventListener("change", () => {
  setSetting("vibration", vibrationToggle.checked);
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


function soundSVG() {
  return `
  <svg viewBox="0 0 24 24" class="icon-svg" aria-hidden="true">
    <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M16 9a3 3 0 0 1 0 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`;
}

function musicSVG() {
  return `
  <svg viewBox="0 0 24 24" class="icon-svg" aria-hidden="true">
    <path d="M9 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <path d="M11 14V5l8-2v9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M17 16a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="none" stroke="currentColor" stroke-width="1.8"/>
  </svg>`;
}

function vibrationSVG() {
  return `
  <svg viewBox="0 0 24 24" class="icon-svg" aria-hidden="true">
    <rect x="7" y="4" width="10" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/>
    <path d="M3 8v8M21 8v8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`;
}