// src/ui/ui.js
export function mountUI(app) {
  app.innerHTML = `
    <div class="phone">
      <!-- ... your existing top + canvas + bottom UI ... -->

      <div class="boardWrap">
        <div class="boardFrame">
          <canvas id="game"></canvas>
        </div>
      </div>

      <!-- ✅ LEVEL COMPLETE OVERLAY (existing) -->
      <div class="overlay" id="levelComplete" style="display:none;">
        <div class="overlayCard">
          <h2 id="lcTitle">Level Complete</h2>
          <p id="lcText">+1 point</p>
          <div class="overlayRow">
            <button class="overlayBtn" id="nextLevelBtn">Next level</button>
            <button class="overlayBtn alt" id="watchAdBtn">Watch ad (+10)</button>
          </div>
        </div>
      </div>

      <!-- ✅ NEW: UNLOCK OVERLAY -->
      <div class="overlay" id="unlockOverlay" style="display:none;">
        <div class="overlayCard">
          <h2 id="unlockTitle">Level locked</h2>
          <p id="unlockText"></p>
          <div class="overlayRow">
            <button class="overlayBtn" id="unlockBtn">Unlock</button>
            <button class="overlayBtn alt" id="cancelUnlockBtn">Cancel</button>
          </div>
        </div>
      </div>

      <!-- Desktop block -->
      <div class="desktopBlock" id="desktopBlock" style="display:none;">
        <div class="desktopCard">
          <h2>Mobile game</h2>
          <p>This game is designed for smartphones. Use swipe on mobile. Desktop is only for testing (arrow keys).</p>
        </div>
      </div>
    </div>
  `;

  const canvas = document.getElementById("game");

  // ✅ Existing UI elements you already use (make sure IDs match your HTML)
  const loginBtn = document.getElementById("loginBtn");
  const loginBtnText = document.getElementById("loginBtnText");
  const userPill = document.getElementById("userPill");

  // Level complete overlay elements
  const levelComplete = document.getElementById("levelComplete");
  const nextLevelBtn = document.getElementById("nextLevelBtn");
  const watchAdBtn = document.getElementById("watchAdBtn");
  const lcTitle = document.getElementById("lcTitle");
  const lcText = document.getElementById("lcText");

  // ✅ Unlock overlay elements
  const unlockOverlay = document.getElementById("unlockOverlay");
  const unlockTitle = document.getElementById("unlockTitle");
  const unlockText = document.getElementById("unlockText");
  const unlockBtn = document.getElementById("unlockBtn");
  const cancelUnlockBtn = document.getElementById("cancelUnlockBtn");

  // points + level name (if you have these)
  const coinCount = document.getElementById("coinCount");
  const levelNameEl = document.getElementById("levelName"); // optional

  const api = {
    canvas,
    loginBtn,
    loginBtnText,
    userPill,

    // internal
    _pendingUnlockIndex: null,

    setPoints(p) {
      if (coinCount) coinCount.textContent = String(p);
    },

    setLevelName(name) {
      if (levelNameEl) levelNameEl.textContent = name;
      // if you show title somewhere else, update it there too
    },

    showLevelComplete({ levelName, pointsEarned, totalPoints }) {
      if (lcTitle) lcTitle.textContent = `${levelName} complete!`;
      if (lcText) lcText.textContent = `+${pointsEarned} point • Total: ${totalPoints}`;
      levelComplete.style.display = "flex";
    },

    hideLevelComplete() {
      levelComplete.style.display = "none";
    },

    onNextLevel(fn) {
      nextLevelBtn?.addEventListener("click", fn);
    },

    onWatchAd(fn) {
      watchAdBtn?.addEventListener("click", fn);
    },

    // ✅ Unlock overlay
    showUnlock({ levelName, cost, points, index }) {
      api._pendingUnlockIndex = index;
      unlockTitle.textContent = `${levelName} locked`;
      unlockText.textContent = `Unlock for ${cost} points? You have ${points}.`;
      unlockBtn.disabled = points < cost;
      unlockOverlay.style.display = "flex";
    },

    hideUnlock() {
      unlockOverlay.style.display = "none";
      api._pendingUnlockIndex = null;
    },

    onUnlockLevel(fn) {
      unlockBtn.addEventListener("click", fn);
    },

    onCancelUnlock(fn) {
      cancelUnlockBtn.addEventListener("click", fn);
    },
  };

  return api;
}