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
  <div class="accountLabel">Levels Completed</div>
  <div class="accountValue" id="accountLevels">0</div>
</div>

<div class="accountSection">
  <div class="accountLabel">Free Skips Used</div>
  <div class="accountValue" id="accountSkipsUsed">0</div>
</div>

<div class="accountSection">
  <div class="accountLabel">Free Hints Used</div>
  <div class="accountValue" id="accountHintsUsed">0</div>
</div>

<div class="accountSection">
  <div class="accountLabel">Free Restarts Used</div>
  <div class="accountValue" id="accountRestartsUsed">0</div>
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

  function setCoins(n) {
    if (coinsEl) coinsEl.textContent = String(n ?? 0);
  }

  closeBtn?.addEventListener("click", hide);
  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) hide();
  });

  return { show, hide, setUser, setCoins };
}