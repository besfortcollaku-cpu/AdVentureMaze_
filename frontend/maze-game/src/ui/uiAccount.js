// src/ui/uiAccount.js
import "../css/account.css";

export function mountAccountUI(root) {
  // Inject overlay HTML once
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="accountOverlay" id="accountOverlay" aria-hidden="true">
      <div class="accountCard">
        <div class="accountHeader">
          <div class="accountTitle">Account</div>
          <button class="accountClose" id="accountCloseBtn" aria-label="Close">✕</button>
        </div>

        <div class="accountSection">
          <div class="accountLabel">Username</div>
          <div class="accountValue" id="accountUsername">guest</div>
        </div>

        <div class="accountSection">
          <div class="accountLabel">UID</div>
          <div class="accountValue mono" id="accountUid">-</div>
        </div>

        <div class="accountSection">
          <div class="accountLabel">Coins</div>
          <div class="accountValue" id="accountCoins">0</div>
        </div>
        <div class="accountSection">
  <button class="accountStatsToggle" id="accountStatsToggle">
    Player Stats ▾
  </button>

  <div class="accountStatsList hidden" id="accountStatsList">
    <div class="accountStatRow">
      <span>Levels Completed</span>
      <span id="accountLevels">0</span>
    </div>

    <div class="accountStatRow">
      <span>Free Skips Used</span>
      <span id="accountSkipsUsed">0</span>
    </div>

    <div class="accountStatRow">
      <span>Free Hints Used</span>
      <span id="accountHintsUsed">0</span>
    </div>

    <div class="accountStatRow">
      <span>Free Restarts Used</span>
      <span id="accountRestartsUsed">0</span>
    </div>
  </div>
</div>
<div class="accountSection" id="inviteSection">
  <div class="accountLabel">Invite Friends</div>

  <div class="accountInviteRow">
    <input
      type="text"
      id="accountInviteLink"
      readonly
      class="accountInviteInput"
    />
    <button id="accountCopyInvite" class="accountInviteBtn">
      Copy
    </button>
  </div>

  <div class="accountInviteStats">
    Invited Users:
    <span id="accountInviteCount">0</span>
  </div>
</div>
        <div class="accountNote">
          Account switching / logout is disabled (Pi Browser).
        </div>
      </div>
    </div>
  `;
  root.appendChild(wrap);

  const overlay = root.querySelector("#accountOverlay");
  const closeBtn = root.querySelector("#accountCloseBtn");

  const usernameEl = root.querySelector("#accountUsername");
  const uidEl = root.querySelector("#accountUid");
  const coinsEl = root.querySelector("#accountCoins");
 const levelsEl = root.querySelector("#accountLevels");
const skipsUsedEl = root.querySelector("#accountSkipsUsed");
const hintsUsedEl = root.querySelector("#accountHintsUsed");
const restartsUsedEl = root.querySelector("#accountRestartsUsed");
const statsToggle = root.querySelector("#accountStatsToggle");
const statsList = root.querySelector("#accountStatsList");
const inviteLinkEl = root.querySelector("#accountInviteLink");
const inviteCountEl = root.querySelector("#accountInviteCount");
const copyInviteBtn = root.querySelector("#accountCopyInvite");
const inviteSection = root.querySelector("#inviteSection");
statsToggle?.addEventListener("click", () => {
  const isHidden = statsList.classList.contains("hidden");

  statsList.classList.toggle("hidden");
  statsToggle.textContent = isHidden
    ? "Player Stats ▴"
    : "Player Stats ▾";
});

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
  const name = user?.username ?? "guest";
  const uid = user?.uid ?? "-";

  if (usernameEl) usernameEl.textContent = name;
  if (uidEl) uidEl.textContent = uid;

  if (levelsEl) levelsEl.textContent = String(user?.level ?? 0);
  if (skipsUsedEl) skipsUsedEl.textContent = String(user?.free_skips_used ?? 0);
  if (hintsUsedEl) hintsUsedEl.textContent = String(user?.free_hints_used ?? 0);
  if (restartsUsedEl) restartsUsedEl.textContent = String(user?.free_restarts_used ?? 0);
}
if (inviteCountEl) {
  inviteCountEl.textContent = String(user?.invited_count ?? 0);
}

if (inviteLinkEl && user?.uid) {
  inviteLinkEl.value = `${window.location.origin}?ref=${user.uid}`;
}

if (inviteSection) {
  inviteSection.style.display = user?.uid ? "block" : "none";
}
copyInviteBtn?.addEventListener("click", async () => {
  if (!inviteLinkEl?.value) return;

  try {
    await navigator.clipboard.writeText(inviteLinkEl.value);
    copyInviteBtn.textContent = "Copied ✓";
    setTimeout(() => {
      copyInviteBtn.textContent = "Copy";
    }, 1500);
  } catch {}
});
  function setCoins(n) {
    if (coinsEl) coinsEl.textContent = String(n ?? 0);
  }

  closeBtn?.addEventListener("click", hide);
  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) hide();
  });

  return { show, hide, setUser, setCoins };
}