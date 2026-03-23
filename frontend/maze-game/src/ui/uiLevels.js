// uiLevels.js
import "../css/levels.css";
import { LEVEL_ACCESS_DEFAULTS } from "../config/levelAccess.js";

export function mountLevelsUI(root, { totalLevels } = {}) {
  // ----- DOM -----
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
      <button class="levelsUnlockBtn hidden" id="levelsUnlockBtn">Watch an ad to unlock now</button>

      <div class="levelsGrid" id="levelsGrid"></div>

      <button class="closeBtn" id="levelsClose">Close</button>
    </div>
  `;

  root.appendChild(overlay);

  const grid = overlay.querySelector("#levelsGrid");
  const accessEl = overlay.querySelector("#levelsAccess");
  const unlockBtn = overlay.querySelector("#levelsUnlockBtn");
  // ----- TOUCH DRAG SCROLL -----
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
  const closeBtn = overlay.querySelector("#levelsClose");

  // ----- STATE -----
  // ----- STATE -----
  let maxUnlocked = 1;
  let selectHandler = null;
  let unlockNowHandler = null;
  let levelAccess = null;

  const TOTAL_LEVELS = Number(totalLevels || 0) || 20;

  // ----- BUILD GRID ONCE -----
  const levelButtons = [];

  for (let i = 1; i <= TOTAL_LEVELS; i++) {
    const btn = document.createElement("button");
    btn.className = "levelBtn";
    btn.dataset.level = i;

    btn.innerHTML = `
      <span class="icon"></span>
      <span class="label">${i}</span>
    `;

    btn.addEventListener("click", () => {
      if (btn.classList.contains("locked")) {
        // If guest taps a locked level above the guest limit, show login-required.
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

  // ----- RENDER STATES -----
  function render() {
    const played = Number(levelAccess?.dailyLevelsPlayed ?? 0);
    const unlocked = Number(levelAccess?.dailyLevelsUnlocked ?? levelAccess?.initialDailyUnlockedLevels ?? LEVEL_ACCESS_DEFAULTS.initialDailyUnlockedLevels);
    const max = Number(levelAccess?.dailyLevelsMax ?? LEVEL_ACCESS_DEFAULTS.dailyLevelsMax);
    const initialUnlocked = Number(levelAccess?.initialDailyUnlockedLevels ?? LEVEL_ACCESS_DEFAULTS.initialDailyUnlockedLevels);
    const unlockLevelsPerInterval = Number(levelAccess?.unlockLevelsPerInterval ?? LEVEL_ACCESS_DEFAULTS.unlockLevelsPerInterval);
    const adUnlockLevels = Number(levelAccess?.adUnlockLevels ?? LEVEL_ACCESS_DEFAULTS.adUnlockLevels);
    const nextUnlockAt = levelAccess?.nextUnlockAt || null;
    const canWatchAdToUnlock = levelAccess?.canWatchAdToUnlock === true;
    const dailyLimitReached = levelAccess?.dailyLimitReached === true;

    let accessHtml = `
      <div class="levelsAccessRow">Levels played today: <b>${played} / ${max}</b></div>
      <div class="levelsAccessRow">Unlocked now: <b>${unlocked}</b></div>
    `;

    const nextUnlockLabel = `Next ${unlockLevelsPerInterval === 1 ? "level unlocks" : `${unlockLevelsPerInterval} levels unlock`} ${formatUnlockTime(nextUnlockAt)}.`;
    const nextUnlockFallback = `Next ${unlockLevelsPerInterval === 1 ? "level unlocks" : `${unlockLevelsPerInterval} levels unlock`} soon.`;

    if (dailyLimitReached) {
      accessHtml += `<div class="levelsAccessState">Daily limit reached. Come back tomorrow for more levels.</div>`;
    } else if (canWatchAdToUnlock) {
      accessHtml += `<div class="levelsAccessState">You've used your current unlocked levels. ${nextUnlockAt ? nextUnlockLabel : nextUnlockFallback}</div>`;
    } else if (played === 0 && unlocked === initialUnlocked) {
      accessHtml += `<div class="levelsAccessHint">${initialUnlocked} levels available now.</div>`;
    } else if (nextUnlockAt) {
      accessHtml += `<div class="levelsAccessHint">${nextUnlockLabel}</div>`;
    }

    accessEl.innerHTML = accessHtml;
    unlockBtn.textContent = `Watch an ad to unlock ${adUnlockLevels} ${adUnlockLevels === 1 ? "level" : "levels"} now`;
    unlockBtn.classList.toggle("hidden", !canWatchAdToUnlock || dailyLimitReached);

    levelButtons.forEach((btn) => {
      const level = Number(btn.dataset.level);
      btn.classList.remove("locked", "completed", "unlocked");

      const icon = btn.querySelector(".icon");

      if (level < maxUnlocked) {
        btn.classList.add("completed");
        icon.innerHTML = btn.classList.contains("locked") ? "🔒" : "✔";
      } else if (level === maxUnlocked) {
        btn.classList.add("unlocked");
        icon.textContent = "";
      } else {
        btn.classList.add("locked");
      }
    });
  }

  function formatUnlockTime(raw) {
    const ms = Date.parse(raw);
    if (!Number.isFinite(ms)) return "soon";
    const diff = Math.max(0, ms - Date.now());
    const totalMinutes = Math.ceil(diff / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0 && minutes > 0) return `in ${hours}h ${minutes}m`;
    if (hours > 0) return `in ${hours}h`;
    return `in ${Math.max(1, minutes)}m`;
  }

  // ----- OPEN / CLOSE -----
  function open() {
    document.body.classList.add("overlay-open");
    overlay.style.display = "flex";
  }

  function close() {
    document.body.classList.remove("overlay-open");
    overlay.style.display = "none";
  }

  closeBtn.addEventListener("click", close);
  unlockBtn.addEventListener("click", () => {
    unlockNowHandler?.();
  });

  // ----- PUBLIC API -----
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
    },

    onSelect(cb) {
      selectHandler = cb;
    },

    onUnlockNow(cb) {
      unlockNowHandler = cb;
    },
  };
}
