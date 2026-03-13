// src/ui/uiAccount.js
import "../css/account.css";

export function mountAccountUI(root) {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="accountOverlay" id="accountOverlay" aria-hidden="true">
      <div class="accountCard full">
        <div class="accountTopBar">
          <div class="accountTopLeft">
            <div class="accountTopNameWrap">
              <span id="accountUsername">guest</span>
              <button id="accountEditName" class="accountEditBtn">Edit</button>
            </div>
            <div class="accountTopCoins">Coins: <span id="accountCoins">0</span></div>
          </div>

          <button class="accountClose" id="accountCloseBtn">X</button>
        </div>

        <div class="accountScroll">
          <div class="accountContent">
            <div class="accountSection">
              <h3>Player Stats</h3>
              <div class="accountRow"><span>Level</span><span id="accountLevels">0</span></div>
              <div class="accountRow"><span>Free Skips Used</span><span id="accountSkipsUsed">0</span></div>
              <div class="accountRow"><span>Free Hints Used</span><span id="accountHintsUsed">0</span></div>
              <div class="accountRow"><span>Free Restarts Used</span><span id="accountRestartsUsed">0</span></div>
            </div>

            <div class="accountSection" id="inviteSection">
              <h3>Invite Friends</h3>
              <div class="accountInviteBox">
                <input id="accountInviteLink" readonly />
                <button id="accountCopyInvite">Copy</button>
              </div>
              <div class="accountRow"><span>Valid Invites (This Month)</span><span id="accountInviteCount">0</span></div>
            </div>

            <div class="accountSection" id="conversionSection">
              <h3>Pi Conversion Rate</h3>
              <div class="accountRow"><span>Current Rate</span><span id="accountRateFinal">50%</span></div>
              <div class="accountRow"><span>Base</span><span id="accountRateBase">50%</span></div>
              <div class="accountRow"><span>Invite Bonus (+2% each, max 10%, persistent)</span><span id="accountRateInvites">0%</span></div>
              <div class="accountRow"><span>Login Bonus (20 days/month max 10%)</span><span id="accountRateLogin">0%</span></div>
              <div class="accountRow"><span>Usage Bonus (Skip/Hint/Restart max 3%)</span><span id="accountRateUsage">0%</span></div>
              <div class="accountRow"><span>Levels Bonus (200 levels/month max 10%)</span><span id="accountRateLevels">0%</span></div>
              <div class="accountRow"><span>Surprise Box Bonus (200/month max 10%)</span><span id="accountRateSurprise">0%</span></div>
              <div class="accountRow"><span>Mystery Box Bonus (1/month = 5%)</span><span id="accountRateMystery">0%</span></div>
              <div class="accountRow"><span>Reserved Bonus (Coming Soon)</span><span id="accountRateReserved">0%</span></div>
              <div class="accountRow"><span>Lifetime Valid Invites</span><span id="accountInviteLifetime">0</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  root.appendChild(wrap);

  const overlay = root.querySelector("#accountOverlay");
  const closeBtn = root.querySelector("#accountCloseBtn");

  const usernameEl = root.querySelector("#accountUsername");
  const coinsEl = root.querySelector("#accountCoins");
  const levelsEl = root.querySelector("#accountLevels");
  const skipsUsedEl = root.querySelector("#accountSkipsUsed");
  const hintsUsedEl = root.querySelector("#accountHintsUsed");
  const restartsUsedEl = root.querySelector("#accountRestartsUsed");

  const inviteLinkEl = root.querySelector("#accountInviteLink");
  const inviteCountEl = root.querySelector("#accountInviteCount");
  const copyInviteBtn = root.querySelector("#accountCopyInvite");
  const inviteSection = root.querySelector("#inviteSection");

  const rateFinalEl = root.querySelector("#accountRateFinal");
  const rateBaseEl = root.querySelector("#accountRateBase");
  const rateInvitesEl = root.querySelector("#accountRateInvites");
  const rateLoginEl = root.querySelector("#accountRateLogin");
  const rateUsageEl = root.querySelector("#accountRateUsage");
  const rateLevelsEl = root.querySelector("#accountRateLevels");
  const rateSurpriseEl = root.querySelector("#accountRateSurprise");
  const rateMysteryEl = root.querySelector("#accountRateMystery");
  const rateReservedEl = root.querySelector("#accountRateReserved");
  const inviteLifetimeEl = root.querySelector("#accountInviteLifetime");

  function show() {
    if (!overlay) return;
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
  }

  function hide() {
    if (!overlay) return;
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
  }

  function setUser(user) {
    if (!user) return;

    if (usernameEl) usernameEl.textContent = user.username ?? "guest";
    if (levelsEl) levelsEl.textContent = String(user.level ?? 0);
    if (skipsUsedEl) skipsUsedEl.textContent = String(user.free_skips_used ?? 0);
    if (hintsUsedEl) hintsUsedEl.textContent = String(user.free_hints_used ?? 0);
    if (restartsUsedEl) restartsUsedEl.textContent = String(user.free_restarts_used ?? 0);

    if (inviteCountEl) inviteCountEl.textContent = String(user.monthly_valid_invites ?? 0);
    if (inviteSection) inviteSection.style.display = user.uid ? "block" : "none";

    if (inviteLinkEl && user.uid) {
      const code = user.invite_code || user.uid;
      inviteLinkEl.value = `${window.location.origin}?invite=${encodeURIComponent(code)}`;
    }

    const breakdown = user.monthly_rate_breakdown || {};
    const finalRate = Number(user.monthly_final_rate ?? 50) || 50;

    if (rateFinalEl) rateFinalEl.textContent = `${finalRate}%`;
    if (rateBaseEl) rateBaseEl.textContent = `${Number(breakdown.base ?? 50)}%`;
    if (rateInvitesEl) rateInvitesEl.textContent = `${Number(breakdown.invites_persistent ?? breakdown.invites ?? 0)}%`;
    if (rateLoginEl) rateLoginEl.textContent = `${Number(breakdown.login_monthly ?? breakdown.daily ?? 0)}%`;
    if (rateUsageEl) rateUsageEl.textContent = `${Number(breakdown.usage_monthly ?? breakdown.skill ?? 0)}%`;
    if (rateLevelsEl) rateLevelsEl.textContent = `${Number(breakdown.levels_monthly ?? breakdown.levels ?? 0)}%`;
    if (rateSurpriseEl) rateSurpriseEl.textContent = `${Number(breakdown.surprise_monthly ?? 0)}%`;
    if (rateMysteryEl) rateMysteryEl.textContent = `${Number(breakdown.mystery_monthly ?? 0)}%`;
    if (rateReservedEl) rateReservedEl.textContent = `${Number(breakdown.reserved_monthly ?? 0)}%`;
    if (inviteLifetimeEl) inviteLifetimeEl.textContent = String(user.lifetime_valid_invites ?? 0);
  }

  function setCoins(n) {
    if (coinsEl) coinsEl.textContent = String(n ?? 0);
  }

  copyInviteBtn?.addEventListener("click", async () => {
    if (!inviteLinkEl?.value) return;
    try {
      await navigator.clipboard.writeText(inviteLinkEl.value);
      copyInviteBtn.textContent = "Copied";
      setTimeout(() => {
        copyInviteBtn.textContent = "Copy";
      }, 1200);
    } catch {
      // no-op
    }
  });

  closeBtn?.addEventListener("click", hide);
  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) hide();
  });

  return { show, hide, setUser, setCoins };
}
