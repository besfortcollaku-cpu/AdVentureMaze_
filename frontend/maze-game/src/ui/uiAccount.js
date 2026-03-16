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
              <div class="accountRow"><span>Have you invited</span><span id="accountInvitedCount">0</span></div>
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
  const invitedByEl = root.querySelector("#accountInvitedBy");
  const invitedCountEl = root.querySelector("#accountInvitedCount");
  const copyInviteBtn = root.querySelector("#accountCopyInvite");
  const inviteSection = root.querySelector("#inviteSection");

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

    if (invitedByEl) invitedByEl.textContent = String(user.invited_by_uid || "-");
    if (invitedCountEl) invitedCountEl.textContent = String(user.lifetime_valid_invites ?? 0);
    if (inviteSection) inviteSection.style.display = user.uid ? "block" : "none";

    if (inviteLinkEl && user.uid) {
      const code = String(user.invite_code || "").trim();
      inviteLinkEl.value = code ? `${window.location.origin}?invite=${encodeURIComponent(code)}` : "";
    }

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

  closeBtn?.addEventListener("click", hide);
  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) hide();
  });

  return { show, hide, setUser, setCoins };
}
