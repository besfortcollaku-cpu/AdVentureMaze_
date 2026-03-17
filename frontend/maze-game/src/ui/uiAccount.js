// src/ui/uiAccount.js
import "../css/account.css";

const DUMMY_COIN_TO_PI_RATE = 0.001;

function formatMonthKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function maskWallet(wallet) {
  const value = String(wallet || "").trim();
  if (!value) return "Not set";
  if (value.length <= 10) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

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
            <div class="accountSection" id="conversionSection">
              <h3>Pi Conversion Progress</h3>
              <div class="accountRow"><span>Current Rate</span><span id="accountRateFinal">50%</span></div>
              <div class="accountRow"><span>Levels</span><span id="accountProgLevels">0/200</span></div>
              <div class="accountRow"><span>Surprise Box</span><span id="accountProgSurprise">0/200</span></div>
              <div class="accountRow"><span>Login Days</span><span id="accountProgLogin">0/20</span></div>
              <div class="accountRow"><span>Mystery Box</span><span id="accountProgMystery">0/1</span></div>
              <div class="accountRow"><span>Skip</span><span id="accountProgSkip">0/5</span></div>
              <div class="accountRow"><span>Hint</span><span id="accountProgHint">0/5</span></div>
              <div class="accountRow"><span>Restart</span><span id="accountProgRestart">0/5</span></div>
              <div class="accountRow"><span>Invites (Lifetime)</span><span id="accountProgInvites">0/5</span></div>

              <div class="accountOverallBlock">
                <div class="accountOverallHead">
                  <span>General Progress to 100%</span>
                  <span id="accountOverallText">50/100</span>
                </div>
                <div class="accountOverallBar">
                  <div id="accountOverallFill" class="accountOverallFill"></div>
                </div>
              </div>
            </div>

            <div class="accountSection" id="inviteSection">
              <h3>Invite Friends</h3>
              <div class="accountInviteBox">
                <input id="accountInviteLink" readonly />
                <button id="accountCopyInvite">Copy</button>
              </div>
              <div class="accountRow"><span>Who invited you</span><span id="accountInvitedBy">-</span></div>
              <div class="accountRow"><span>Have you invited</span></div>
              <div class="accountRow"><span id="accountInvitedList">No invited friends yet</span></div>
            </div>

            <div class="accountSection" id="walletSection">
              <h3>Pi Wallet</h3>
              <div class="accountRow"><span>Saved Wallet</span><span id="accountWalletMasked" class="accountWalletMasked">Not set</span></div>
              <div class="accountWalletBox">
                <input id="accountWalletInput" placeholder="Enter Pi Wallet Address" maxlength="100" autocomplete="off" />
                <button id="accountSaveWallet">Save Wallet</button>
              </div>
              <div class="accountWalletStatus" id="accountWalletStatus"></div>
            </div>

            <div class="accountSection" id="monthlyTransferSection">
              <h3>Monthly Coin to Pi (Preview)</h3>
              <div class="accountRow"><span>Month</span><span id="accountMonthCurrent">-</span></div>
              <div class="accountRow"><span>Coins</span><span id="accountMonthCoins">0</span></div>
              <div class="accountRow"><span>Convertible Rate</span><span id="accountMonthRate">50%</span></div>
              <div class="accountRow"><span>Coin to Pi Rate</span><span id="accountCoinToPiRate">0.001</span></div>
              <div class="accountRow"><span>Total Pi</span><span id="accountMonthTotalPi">0.0000</span></div>
              <div class="accountRow"><span>Your Pi will be sent to</span><span id="accountPayoutWalletConfirm">Not set</span></div>
              <div class="accountRow"><button id="accountClaimPiBtn">Claim (Dummy)</button></div>

              <div class="accountRow"><span>Previous Month</span><span id="accountPrevMonth">-</span></div>
              <div class="accountRow"><span>Prev Total Pi</span><span id="accountPrevMonthPi">0.0000</span></div>
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

  const inviteLinkEl = root.querySelector("#accountInviteLink");
  const invitedByEl = root.querySelector("#accountInvitedBy");
  const invitedListEl = root.querySelector("#accountInvitedList");
  const copyInviteBtn = root.querySelector("#accountCopyInvite");
  const inviteSection = root.querySelector("#inviteSection");

  const walletMaskedEl = root.querySelector("#accountWalletMasked");
  const walletInputEl = root.querySelector("#accountWalletInput");
  const saveWalletBtn = root.querySelector("#accountSaveWallet");
  const walletStatusEl = root.querySelector("#accountWalletStatus");
  const payoutWalletConfirmEl = root.querySelector("#accountPayoutWalletConfirm");

  const rateFinalEl = root.querySelector("#accountRateFinal");
  const progLevelsEl = root.querySelector("#accountProgLevels");
  const progSurpriseEl = root.querySelector("#accountProgSurprise");
  const progLoginEl = root.querySelector("#accountProgLogin");
  const progMysteryEl = root.querySelector("#accountProgMystery");
  const progSkipEl = root.querySelector("#accountProgSkip");
  const progHintEl = root.querySelector("#accountProgHint");
  const progRestartEl = root.querySelector("#accountProgRestart");
  const progInvitesEl = root.querySelector("#accountProgInvites");
  const overallTextEl = root.querySelector("#accountOverallText");
  const overallFillEl = root.querySelector("#accountOverallFill");

  const monthCurrentEl = root.querySelector("#accountMonthCurrent");
  const monthCoinsEl = root.querySelector("#accountMonthCoins");
  const monthRateEl = root.querySelector("#accountMonthRate");
  const coinToPiRateEl = root.querySelector("#accountCoinToPiRate");
  const monthTotalPiEl = root.querySelector("#accountMonthTotalPi");
  const claimPiBtn = root.querySelector("#accountClaimPiBtn");
  const prevMonthEl = root.querySelector("#accountPrevMonth");
  const prevMonthPiEl = root.querySelector("#accountPrevMonthPi");

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

    if (invitedByEl) invitedByEl.textContent = String(user.invited_by_name || user.invited_by_uid || "-");
    if (inviteSection) inviteSection.style.display = user.uid ? "block" : "none";

    const invitedNames = Array.isArray(user.invited_usernames)
      ? user.invited_usernames.map((n) => String(n || "").trim()).filter(Boolean)
      : [];

    if (invitedListEl) {
      invitedListEl.textContent = invitedNames.length
        ? invitedNames.join(", ")
        : "No invited friends yet";
    }

    if (inviteLinkEl && user.uid) {
      const code = String(user.invite_code || "").trim();
      inviteLinkEl.value = code ? `${window.location.origin}?invite=${encodeURIComponent(code)}` : "";
    }

    const wallet = String(user.pi_wallet_identifier || "").trim();
    if (walletMaskedEl) walletMaskedEl.textContent = maskWallet(wallet);
    if (walletInputEl && wallet) walletInputEl.value = wallet;
    if (payoutWalletConfirmEl) payoutWalletConfirmEl.textContent = maskWallet(wallet);

    const finalRate = Number(user.monthly_final_rate ?? 50) || 50;
    const levelsDone = Number(user.monthly_levels_completed ?? 0);
    const surpriseDone = Number(user.monthly_surprise_boxes_opened ?? 0);
    const loginDone = Number(user.monthly_login_days ?? 0);
    const mysteryDone = Number(user.monthly_mystery_boxes_opened ?? 0);
    const skipDone = Number(user.monthly_skips_used ?? 0);
    const hintDone = Number(user.monthly_hints_used ?? 0);
    const restartDone = Number(user.monthly_restarts_used ?? 0);
    const invitesDone = Number(user.lifetime_valid_invites ?? 0);
    const rateClamped = Math.max(0, Math.min(100, finalRate));

    if (rateFinalEl) rateFinalEl.textContent = `${finalRate}%`;
    if (progLevelsEl) progLevelsEl.textContent = `${Math.min(levelsDone, 200)}/200`;
    if (progSurpriseEl) progSurpriseEl.textContent = `${Math.min(surpriseDone, 200)}/200`;
    if (progLoginEl) progLoginEl.textContent = `${Math.min(loginDone, 20)}/20`;
    if (progMysteryEl) progMysteryEl.textContent = `${Math.min(mysteryDone, 1)}/1`;
    if (progSkipEl) progSkipEl.textContent = `${Math.min(skipDone, 5)}/5`;
    if (progHintEl) progHintEl.textContent = `${Math.min(hintDone, 5)}/5`;
    if (progRestartEl) progRestartEl.textContent = `${Math.min(restartDone, 5)}/5`;
    if (progInvitesEl) progInvitesEl.textContent = `${Math.min(invitesDone, 5)}/5`;
    if (overallTextEl) overallTextEl.textContent = `${rateClamped}/100`;
    if (overallFillEl) overallFillEl.style.width = `${rateClamped}%`;

    // Monthly conversion preview (dummy calculation for now)
    const now = new Date();
    const currentMonth = formatMonthKey(now);
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = formatMonthKey(prev);

    const monthCoins = Math.max(0, Number(user.monthly_coins_earned ?? user.coins ?? 0));
    const rate = Math.max(0, Math.min(100, Number(user.monthly_final_rate ?? 50)));
    const totalPi = (monthCoins * (rate / 100) * DUMMY_COIN_TO_PI_RATE).toFixed(4);

    if (monthCurrentEl) monthCurrentEl.textContent = currentMonth;
    if (monthCoinsEl) monthCoinsEl.textContent = String(monthCoins);
    if (monthRateEl) monthRateEl.textContent = `${rate}%`;
    if (coinToPiRateEl) coinToPiRateEl.textContent = String(DUMMY_COIN_TO_PI_RATE);
    if (monthTotalPiEl) monthTotalPiEl.textContent = totalPi;

    if (prevMonthEl) prevMonthEl.textContent = prevMonth;
    if (prevMonthPiEl) prevMonthPiEl.textContent = totalPi;
  }

  function setCoins(n) {
    if (coinsEl) coinsEl.textContent = String(n ?? 0);
  }

  async function copyInviteLinkText(text) {
    const value = String(text || "").trim();
    if (!value) return false;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch {}

    try {
      const tempInput = document.createElement("input");
      tempInput.value = value;
      tempInput.setAttribute("readonly", "");
      tempInput.style.position = "fixed";
      tempInput.style.opacity = "0";
      tempInput.style.pointerEvents = "none";
      document.body.appendChild(tempInput);
      tempInput.focus();
      tempInput.select();
      tempInput.setSelectionRange(0, tempInput.value.length);
      const ok = document.execCommand("copy");
      tempInput.remove();
      return Boolean(ok);
    } catch {
      return false;
    }
  }

  copyInviteBtn?.addEventListener("click", async () => {
    if (!inviteLinkEl?.value) return;

    const ok = await copyInviteLinkText(inviteLinkEl.value);
    copyInviteBtn.textContent = ok ? "Copied" : "Copy Failed";

    setTimeout(() => {
      copyInviteBtn.textContent = "Copy";
    }, 1200);
  });

  saveWalletBtn?.addEventListener("click", async () => {
    const wallet = String(walletInputEl?.value || "").trim();
    if (!wallet) {
      if (walletStatusEl) walletStatusEl.textContent = "Enter wallet first.";
      return;
    }

    const api = window.__maze?.setWallet;
    if (typeof api !== "function") {
      if (walletStatusEl) walletStatusEl.textContent = "Wallet save unavailable.";
      return;
    }

    saveWalletBtn.disabled = true;
    if (walletStatusEl) walletStatusEl.textContent = "Saving...";

    try {
      const out = await api(wallet);
      if (!out?.ok) {
        if (walletStatusEl) walletStatusEl.textContent = out?.error === "invalid_wallet"
          ? "Invalid wallet format. Use letters/numbers only."
          : (out?.error || "Failed to save wallet.");
        return;
      }

      const normalized = wallet.toLowerCase();
      if (walletMaskedEl) walletMaskedEl.textContent = maskWallet(normalized);
      if (payoutWalletConfirmEl) payoutWalletConfirmEl.textContent = maskWallet(normalized);
      if (walletStatusEl) walletStatusEl.textContent = "Wallet saved. Payouts will be sent here.";
    } catch {
      if (walletStatusEl) walletStatusEl.textContent = "Failed to save wallet.";
    } finally {
      saveWalletBtn.disabled = false;
    }
  });

  claimPiBtn?.addEventListener("click", () => {
    claimPiBtn.textContent = "Claimed (Dummy)";
    setTimeout(() => {
      claimPiBtn.textContent = "Claim (Dummy)";
    }, 1400);
  });

  closeBtn?.addEventListener("click", hide);
  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) hide();
  });

  return { show, hide, setUser, setCoins };
}
