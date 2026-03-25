import "../css/settings.css";
import { getSettings, setSetting, subscribeSettings } from "../settings.js";
import { unlockGlobalAudio } from "../audio/audioManager.js";
import { createPrivacyAdsPopup } from "./uiPrivacyAds.js";

export function mountSettingsUI(root) {
  const privacyAdsPopup = createPrivacyAdsPopup();
  const el = document.createElement("div");
  el.id = "settingsOverlay";
  el.className = "settings-overlay hidden";

  el.innerHTML = `
<div class="settings-backdrop"></div>
    <div class="settings-card">
      <div class="settings-header">
        <h2>Settings</h2>
        <button class="close-btn">x</button>
      </div>

      <div class="settings-item">
        <div>
          <strong>Sound Effects</strong>
        </div>
        <label class="switch">
          <input type="checkbox" id="soundToggle">
          <span class="slider"></span>
        </label>
      </div>

      <div class="settings-item">
        <div>
          <strong>Background Music</strong>
        </div>
        <label class="switch">
          <input type="checkbox" id="musicToggle">
          <span class="slider"></span>
        </label>
      </div>

      <div class="settings-item">
        <div>
          <strong>Slide Ball Sound</strong>
        </div>
        <label class="switch">
          <input type="checkbox" id="slideSoundToggle">
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

      <div class="settings-item">
        <div>
          <strong>Gyroscope</strong>
          <div class="desc">Tilt phone to move ball</div>
        </div>
        <label class="switch">
          <input type="checkbox" id="gyroToggle">
          <span class="slider"></span>
        </label>
      </div>

      <div class="settings-item settings-item-action">
        <div>
          <strong>Privacy & Ads</strong>
          <div class="desc" id="manageConsentDesc">Manage personalized ads.</div>
        </div>
        <button id="manageConsentBtn" class="settings-action-btn">Open</button>
      </div>

      <p class="settings-hint">Changes are saved automatically.</p>
    </div>
  `;

  root.appendChild(el);

  const gyroToggle = el.querySelector("#gyroToggle");
  const soundToggle = el.querySelector("#soundToggle");
  const musicToggle = el.querySelector("#musicToggle");
  const slideSoundToggle = el.querySelector("#slideSoundToggle");
  const vibrationToggle = el.querySelector("#vibrationToggle");
  const manageConsentBtn = el.querySelector("#manageConsentBtn");
  const manageConsentDesc = el.querySelector("#manageConsentDesc");

  gyroToggle.checked = localStorage.getItem("gyro") === "on";
  gyroToggle.addEventListener("change", () => {
    localStorage.setItem("gyro", gyroToggle.checked ? "on" : "off");
  });

  const s0 = getSettings();
  soundToggle.checked = !!s0.sound;
  musicToggle.checked = !!(s0.music ?? s0.sound);
  slideSoundToggle.checked = !!(s0.slideSound ?? true);
  vibrationToggle.checked = !!s0.vibration;

  subscribeSettings((s) => {
    soundToggle.checked = !!s.sound;
    musicToggle.checked = !!(s.music ?? s.sound);
    slideSoundToggle.checked = !!(s.slideSound ?? true);
    vibrationToggle.checked = !!s.vibration;
  });

  soundToggle.addEventListener("change", () => {
    const checked = soundToggle.checked;
    setSetting("sound", checked);
    if (checked) {
      unlockGlobalAudio();
    }
  });

  musicToggle.addEventListener("change", () => {
    const checked = musicToggle.checked;
    setSetting("music", checked);
    if (checked) {
      unlockGlobalAudio();
    }
  });

  slideSoundToggle.addEventListener("change", () => {
    setSetting("slideSound", slideSoundToggle.checked);
  });

  vibrationToggle.addEventListener("change", () => {
    setSetting("vibration", vibrationToggle.checked);
  });

  function refreshConsentState() {
    if (manageConsentDesc) {
      manageConsentDesc.textContent = window.__maze?.getAdConsentSummary?.() || "Manage personalized ads.";
    }
  }

  refreshConsentState();
  window.addEventListener("maze:ad-consent-changed", refreshConsentState);

  privacyAdsPopup.onManageConsent(() => {
    try {
      window.__maze?.openAdConsent?.();
      refreshConsentState();
    } catch {
      window.__maze?.showToast?.("Unable to open consent settings right now.");
    }
  });

  manageConsentBtn?.addEventListener("click", () => {
    privacyAdsPopup.open({
      statusText: window.__maze?.getAdConsentSummary?.() || "Manage personalized ads.",
    });
  });

  el.querySelector(".close-btn").onclick = close;
  el.querySelector(".settings-backdrop").onclick = close;

  function open() {
    refreshConsentState();
    el.classList.remove("hidden");
    document.body.classList.add("modal-open");
  }

  function close() {
    el.classList.add("hidden");
    document.body.classList.remove("modal-open");
  }

  return { open, close };
}
