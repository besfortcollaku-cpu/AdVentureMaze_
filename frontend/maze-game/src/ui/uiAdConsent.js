import "../css/restart.css";
import "../css/adConsent.css";

export function createAdConsentPopup() {
  const el = document.createElement("div");
  el.className = "popup hidden";
  el.innerHTML = `
    <div class="popup-card ad-consent-card">
      <h3>Privacy & Ads</h3>
      <div class="popup-balance" id="adConsentStatus">Choose your ads preference before loading ads.</div>
      <div class="popup-note">We use ads to support the game.</div>
      <div class="popup-subnote">You can choose whether to allow personalized ads where required by law. You can update this choice later in Settings.</div>
      <button id="allowPersonalizedAdsBtn" class="ad-consent-primary">Allow Personalized Ads</button>
      <button id="useStandardAdsBtn" class="ad-consent-secondary">Use Non-Personalized Ads</button>
      <button id="closeAdConsentBtn" class="ad-consent-close">Close</button>
    </div>
  `;
  document.body.appendChild(el);

  const closeBtn = el.querySelector("#closeAdConsentBtn");
  const statusEl = el.querySelector("#adConsentStatus");

  let onAllow = null;
  let onNonPersonalized = null;
  let onClose = null;

  el.querySelector("#allowPersonalizedAdsBtn").onclick = () => onAllow?.();
  el.querySelector("#useStandardAdsBtn").onclick = () => onNonPersonalized?.();
  closeBtn.onclick = () => onClose?.();

  return {
    open({ statusText = "", requireChoice = false } = {}) {
      if (statusEl) {
        statusEl.textContent = statusText || "Choose your ads preference before loading ads.";
      }

      if (closeBtn) {
        closeBtn.style.display = requireChoice ? "none" : "";
      }

      el.classList.remove("hidden");
    },
    hide() {
      el.classList.add("hidden");
    },
    onAllow(cb) {
      onAllow = cb;
    },
    onNonPersonalized(cb) {
      onNonPersonalized = cb;
    },
    onClose(cb) {
      onClose = cb;
    },
  };
}
