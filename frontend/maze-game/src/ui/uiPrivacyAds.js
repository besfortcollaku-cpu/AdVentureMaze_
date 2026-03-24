import "../css/restart.css";
import "../css/adConsent.css";

export function createPrivacyAdsPopup() {
  const el = document.createElement("div");
  el.className = "popup hidden";
  el.innerHTML = `
    <div class="popup-card ad-consent-card privacy-ads-card">
      <div id="privacyAdsOverview">
        <h3>Privacy & Ads</h3>
        <div class="popup-balance" id="privacyAdsStatus">Manage your ads settings.</div>
        <div class="popup-note">We use ads to support the game.</div>
        <div class="popup-subnote">Where required by law, you can manage your ad consent choices. You can also review our Privacy Policy.</div>
        <button id="manageAdConsentBtn" class="ad-consent-primary">Manage Ad Consent</button>
        <button id="openPrivacyPolicyBtn" class="ad-consent-secondary">Open Privacy Policy</button>
        <button id="closePrivacyAdsBtn" class="ad-consent-close">Close</button>
      </div>

      <div id="privacyPolicyView" class="hidden">
        <h3>Privacy Policy</h3>
        <div class="popup-subnote privacy-policy-copy">
          We use your game account details, gameplay progress, and ad preferences to operate the game and support core features.
          Coins, Score, leaderboard progress, and account settings are stored so your progress can continue across sessions.
          Ads may use consent choices you make in the app. You can reopen consent settings at any time from Privacy & Ads.
        </div>
        <div class="popup-subnote privacy-policy-copy">
          If you need a full hosted Privacy Policy, add your production policy URL here later. This in-app screen is a local privacy summary for now.
        </div>
        <button id="backFromPrivacyPolicyBtn" class="ad-consent-secondary">Back</button>
      </div>
    </div>
  `;

  document.body.appendChild(el);

  const overview = el.querySelector("#privacyAdsOverview");
  const policyView = el.querySelector("#privacyPolicyView");
  const statusEl = el.querySelector("#privacyAdsStatus");

  let onManageConsent = null;

  function showOverview() {
    overview.classList.remove("hidden");
    policyView.classList.add("hidden");
  }

  function showPolicy() {
    overview.classList.add("hidden");
    policyView.classList.remove("hidden");
  }

  el.querySelector("#manageAdConsentBtn").onclick = () => onManageConsent?.();
  el.querySelector("#openPrivacyPolicyBtn").onclick = () => showPolicy();
  el.querySelector("#closePrivacyAdsBtn").onclick = () => api.hide();
  el.querySelector("#backFromPrivacyPolicyBtn").onclick = () => showOverview();

  const api = {
    open({ statusText = "" } = {}) {
      if (statusEl) {
        statusEl.textContent = statusText || "Manage your ads settings.";
      }
      showOverview();
      el.classList.remove("hidden");
    },
    hide() {
      showOverview();
      el.classList.add("hidden");
    },
    onManageConsent(cb) {
      onManageConsent = cb;
    },
  };

  return api;
}
