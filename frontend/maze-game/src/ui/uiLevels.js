// uiLevels.js
import "../css/levels.css";
import { LEVEL_ACCESS_DEFAULTS } from "../config/levelAccess.js";

export function mountLevelsUI(root, { totalLevels } = {}) {
  const overlay = document.createElement("div");
  overlay.id = "levelsOverlay";
  overlay.className = "levelsOverlay";

  overlay.innerHTML = `
    <div class="levelsCard">
      <div class="levelsHeader">
        <span class="badge">LEVELS</span>
        <h2>Select Level</h2>
      </div>

      <div class="levelsAccess" id="levelsAccess"></div>
      <button class="levelsUnlockBtn hidden" id="levelsUnlockBtn">Unlock More Levels</button>

      <div class="levelsGrid" id="levelsGrid"></div>

      <button class="closeBtn" id="levelsClose">Close</button>
    </div>
  `;

  root.appendChild(overlay);

  const grid = overlay.querySelector("#levelsGrid");
  const accessEl = overlay.querySelector("#levelsAccess");
  const unlockBtn = overlay.querySelector("#levelsUnlockBtn");
  const closeBtn = overlay.querySelector("#levelsClose");

  let startY = 0;
  let startScroll = 0;

  overlay.addEventListener("touchstart", (e) => {
    startY = e.touches[0].clientY;
    startScroll = grid.scrollTop;
  }, { passive: true });

  overlay.addEventListener("touchmove", (e) => {
    const currentY = e.touches[0].clientY;
    const delta = startY - currentY;
    grid.scrollTop = startScroll + delta;
  }, { passive: true });

  let maxUnlocked = 1;
  let selectHandler = null;
  let unlockNowHandler = null;
  let refreshAccessHandler = null;
  let levelAccess = null;
  let completedLevels = new Set();
  let skippedLevels = new Set();
  let countdownTimer = null;
  let countdownRefreshPending = false;

  const TOTAL_LEVELS = Number(totalLevels || 0) || 20;
  const levelButtons = [];

  for (let i = 1; i <= TOTAL_LEVELS; i++) {
    const btn = document.createElement("button");
    btn.className = "levelBtn";
    btn.dataset.level = i;

    btn.innerHTML = `
      <span class="icon"></span>
      <span class="label">${i}</span>
      <span class="stateBadge"></span>
    `;

    btn.addEventListener("click", () => {
      if (btn.classList.contains("timeLocked")) {
        return;
      }
      if (btn.classList.contains("locked")) {
        const maze = window.__maze;
        const guestMax = Number(maze?.guestMaxLevel || 0);
        const isLoggedIn = maze?.isLoggedIn?.() === true;
        if (!isLoggedIn && guestMax > 0 && i > guestMax) {
          maze?.showLoginRequired?.();
        }
        return;
      }
      const shouldClose = selectHandler?.(i);
      if (shouldClose !== false) {
        close();
      }
    });

    grid.appendChild(btn);
    levelButtons.push(btn);
  }

  function render() {
    const played = Number(levelAccess?.dailyLevelsPlayed ?? 0);
    const unlocked = Number(levelAccess?.dailyLevelsUnlocked ?? levelAccess?.initialDailyUnlockedLevels ?? LEVEL_ACCESS_DEFAULTS.initialDailyUnlockedLevels);
    const max = Number(levelAccess?.dailyLevelsMax ?? LEVEL_ACCESS_DEFAULTS.dailyLevelsMax);
    const initialUnlocked = Number(levelAccess?.initialDailyUnlockedLevels ?? LEVEL_ACCESS_DEFAULTS.initialDailyUnlockedLevels);
    const unlockLevelsPerInterval = Number(levelAccess?.unlockLevelsPerInterval ?? LEVEL_ACCESS_DEFAULTS.unlockLevelsPerInterval);
    const nextUnlockAt = levelAccess?.nextUnlockAt || null;
    const canWatchAdToUnlock = levelAccess?.canWatchAdToUnlock === true;
    const dailyLimitReached = levelAccess?.dailyLimitReached === true;
    const canPlayNow = levelAccess?.canPlayNow !== false;
    const hasActiveFrontierCountdown = !dailyLimitReached && !canPlayNow && hasUnlockCountdown(nextUnlockAt);
    const frontierLevel = Math.max(1, Number(maxUnlocked || 1));

    let accessHtml = `
      <div class="levelsAccessRow">Levels played today: <b>${played} / ${max}</b></div>
      <div class="levelsAccessRow">Unlocked now: <b>${unlocked}</b></div>
    `;

    const nextUnlockLabel = `Come back ${formatUnlockTime(nextUnlockAt)} for Level ${frontierLevel}.`;
    const nextUnlockFallback = `More new levels unlock later today.`;

    if (dailyLimitReached) {
      accessHtml += `<div class="levelsAccessState">New progression resumes tomorrow. You can still replay unlocked levels now.</div>`;
    } else if (canWatchAdToUnlock) {
      accessHtml += `<div class="levelsAccessState">You've used your current new levels. ${nextUnlockAt ? nextUnlockLabel : nextUnlockFallback}</div>`;
    } else if (played === 0 && unlocked === initialUnlocked) {
      accessHtml += `<div class="levelsAccessHint">${initialUnlocked} levels available now.</div>`;
    } else if (nextUnlockAt) {
      accessHtml += `<div class="levelsAccessHint">Next: Level ${frontierLevel} ${formatUnlockTime(nextUnlockAt)}.</div>`;
    }

    if (canPlayNow) {
      accessHtml += `<div class="levelsAccessHint levelsFrontierHint">Your next new level is highlighted below.</div>`;
    } else if (hasActiveFrontierCountdown) {
      accessHtml += `<div class="levelsAccessHint levelsFrontierHint">Come back ${formatUnlockTime(nextUnlockAt, { detailed: true })} for Level ${frontierLevel}. You can still replay unlocked levels now.${canWatchAdToUnlock ? " Or unlock now below." : ""}</div>`;
    } else if (!dailyLimitReached) {
      accessHtml += `<div class="levelsAccessHint levelsFrontierHint">The highlighted level is your next progression unlock.</div>`;
    }

    accessEl.innerHTML = accessHtml;
    unlockBtn.textContent = hasActiveFrontierCountdown ? "Unlock More Levels Now" : "Unlock More Levels";
    unlockBtn.classList.toggle("hidden", !canWatchAdToUnlock || dailyLimitReached);

    levelButtons.forEach((btn) => {
      const level = Number(btn.dataset.level);
      const icon = btn.querySelector(".icon");
      const stateBadge = btn.querySelector(".stateBadge");
      const isCompleted = completedLevels.has(level);
      const isSkipped = skippedLevels.has(level) && !isCompleted;
      const isCurrentLevel = level === maxUnlocked;
      const isAvailableNow = isCurrentLevel && canPlayNow;
      const isTimeLockedNext = isCurrentLevel && !canPlayNow;
      const isPreviouslyUnlocked = level < maxUnlocked && !isCompleted && !isSkipped;
      const isFrontier = isCurrentLevel;

      btn.classList.remove("locked", "completed", "skipped", "unlocked", "timeLocked", "futureLocked", "replayable", "availableNow", "frontier");
      btn.title = "";

      if (isCompleted) {
        btn.classList.add("completed", "replayable");
        btn.title = "Replay levels do not grant Coins or Score.";
        if (icon) icon.textContent = "";
        if (stateBadge) stateBadge.textContent = "Replay";
      } else if (isSkipped) {
        btn.classList.add("unlocked", "skipped");
        btn.title = "Skipped levels can be completed later for normal rewards.";
        if (icon) icon.textContent = "";
        if (stateBadge) stateBadge.textContent = "Skipped";
      } else if (isAvailableNow) {
        btn.classList.add("unlocked", "availableNow", "frontier");
        btn.title = "Available";
        if (icon) icon.textContent = "";
        if (stateBadge) stateBadge.textContent = "Next";
      } else if (isPreviouslyUnlocked) {
        btn.classList.add("unlocked");
        btn.title = "Available";
        if (icon) icon.textContent = "";
        if (stateBadge) stateBadge.textContent = "Available";
      } else if (isTimeLockedNext) {
        btn.classList.add("timeLocked", "frontier");
        btn.title = nextUnlockAt ? `Unlocks ${formatUnlockTime(nextUnlockAt, { detailed: true })}.` : "Available later.";
        if (icon) icon.textContent = "";
        if (stateBadge) stateBadge.textContent = nextUnlockAt ? `Next • ${formatUnlockTime(nextUnlockAt, { detailed: true })}` : "Next";
      } else {
        btn.classList.add("locked", "futureLocked");
        btn.title = "Locked";
        if (icon) icon.textContent = "";
        if (stateBadge) stateBadge.textContent = "Locked";
      }

      if (isFrontier) {
        btn.setAttribute("aria-current", "step");
      } else {
        btn.removeAttribute("aria-current");
      }
    });

    ensureFrontierVisible();
  }

  function getRemainingMs(raw) {
    const ms = Date.parse(raw);
    if (!Number.isFinite(ms)) return null;
    return Math.max(0, ms - Date.now());
  }

  function hasUnlockCountdown(raw) {
    const remainingMs = getRemainingMs(raw);
    return remainingMs !== null && remainingMs > 0;
  }

  function formatUnlockTime(raw, { detailed = false } = {}) {
    const diff = getRemainingMs(raw);
    if (diff === null) return "soon";
    const totalMinutes = Math.ceil(diff / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (detailed && diff < 3600000) {
      const totalSeconds = Math.max(1, Math.ceil(diff / 1000));
      const displayMinutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      if (displayMinutes > 0) return `in ${displayMinutes}m ${String(seconds).padStart(2, "0")}s`;
      return `in ${seconds}s`;
    }
    if (hours > 0 && minutes > 0) return `in ${hours}h ${minutes}m`;
    if (hours > 0) return `in ${hours}h`;
    return `in ${Math.max(1, minutes)}m`;
  }

  function stopCountdownTimer() {
    if (countdownTimer) {
      window.clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  async function refreshFrontierAccess() {
    if (countdownRefreshPending) return;
    countdownRefreshPending = true;
    try {
      await refreshAccessHandler?.();
    } finally {
      countdownRefreshPending = false;
      render();
      syncCountdownTimer();
    }
  }

  function syncCountdownTimer() {
    stopCountdownTimer();

    if (overlay.style.display !== "flex") {
      return;
    }

    if (!hasUnlockCountdown(levelAccess?.nextUnlockAt) || levelAccess?.canPlayNow === true || levelAccess?.dailyLimitReached === true) {
      return;
    }

    countdownTimer = window.setInterval(() => {
      if (!hasUnlockCountdown(levelAccess?.nextUnlockAt)) {
        stopCountdownTimer();
        refreshFrontierAccess();
        return;
      }
      render();
    }, 1000);
  }

  function open() {
    document.body.classList.add("overlay-open");
    overlay.style.display = "flex";
    syncCountdownTimer();
    ensureFrontierVisible();
  }

  function close() {
    document.body.classList.remove("overlay-open");
    overlay.style.display = "none";
    stopCountdownTimer();
  }

  closeBtn.addEventListener("click", close);
  unlockBtn.addEventListener("click", () => {
    unlockNowHandler?.();
  });

  function ensureFrontierVisible() {
    if (overlay.style.display !== "flex") {
      return;
    }
    const frontierBtn = grid.querySelector(".levelBtn.frontier");
    if (!frontierBtn) {
      return;
    }
    window.requestAnimationFrame(() => {
      frontierBtn.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }

  return {
    open,
    close,

    setUnlocked(level) {
      maxUnlocked = Math.max(1, level || 1);
      render();
    },

    setLevelAccess(nextAccess) {
      levelAccess = nextAccess || null;
      render();
      syncCountdownTimer();
    },

    setCompletedLevels(levels) {
      completedLevels = new Set(
        Array.isArray(levels)
          ? levels.map((level) => Number(level)).filter((level) => Number.isInteger(level) && level > 0)
          : []
      );
      render();
    },

    setSkippedLevels(levels) {
      skippedLevels = new Set(
        Array.isArray(levels)
          ? levels
              .map((level) => Number(level))
              .filter((level) => Number.isInteger(level) && level > 0 && !completedLevels.has(level))
          : []
      );
      render();
    },

    onSelect(cb) {
      selectHandler = cb;
    },

    onUnlockNow(cb) {
      unlockNowHandler = cb;
    },

    onRefreshAccess(cb) {
      refreshAccessHandler = cb;
    },

    ensureFrontierVisible,
  };
}
