import "./css/ui.css";
import "./css/ads.css";
import { mountLevelsUI } from "./ui/uiLevels.js";
import { mountUI } from "./ui/ui.js";
import { loadProgress } from "./api/loadProgress.js";
import { createGame } from "./game/game.js";
import { ensurePiLogin, prestartPiLogin } from "./pi/piClient.js";
import { levels } from "./levels/index.js";
import { LEVEL_ROUTES } from "./hints/levelRoutes.js";
import { createWinPopup } from "./ui/uiWin.js";
import { createSkipPopup } from "./ui/uiSkip.js";
import { createHintPopup } from "./ui/uiHints.js";
import { createRestartPopup } from "./ui/uiRestarts.js";
import { createMysteryChestPopup } from "./ui/uiMysteryChest.js";
import { createDailyRankingRewardPopup } from "./ui/uiDailyRankingReward.js";
import { getSettings, subscribeSettings } from "./settings.js";
import { LEVEL_ACCESS_DEFAULTS } from "./config/levelAccess.js";
import { unlockGlobalAudio, play as playAudio, setMusicEnabled, setSfxEnabled, setMasterVolume, startBackgroundMusic, stopBackgroundMusic } from "./audio/audioManager.js";

// DEBUG: show fatal errors on mobile so buttons don't "do nothing"
window.addEventListener("error", (e) => {
  alert("JS ERROR: " + (e?.message || "unknown"));
});
window.addEventListener("unhandledrejection", (e) => {
  const msg = e?.reason?.message || String(e?.reason || "unknown");
  alert("PROMISE ERROR: " + msg);
});
const GUEST_PROGRESS_KEY = "guest_progress_v1";
const GUEST_MAX_LEVEL = 5;
let CURRENT_USER = null;
let CURRENT_COMPLETED_LEVELS = new Set();
let AD_OVERLAY_ACTIVE = false;

Object.defineProperty(window, "__DEBUG_USER", {
  get() {
    return CURRENT_USER;
  }
});
let CURRENT_ACCESS_TOKEN = null;
let ui = null;
let levelsUI = null;
let game = null;
let HINT_ACTIVE_FOR_LEVEL = false;
let HINT_ROUTE = null;
let HINT_ROUTE_INDEX = 0;
let HINT_ROUTE_TIMER = null;
let CURRENT_MISSED_DAY = null;
let CURRENT_MISSED_COINS = null;
// hint system state
let HINT_RECALC_TIMER = null;
const BACKEND = "https://triumphant-gentleness-production.up.railway.app";
const FREE_SKIPS = 3;
const FREE_HINTS = 3;
const FREE_RESTARTS = 3;
let LOGIN_IN_PROGRESS = false;
// tutorial hint flag
const AUTO_HINT_SEEN_KEY = "auto_hint_seen_v1";
const AD_COOLDOWN_MS = 180_000;
const AD_LAST_CLAIM_KEY = "ad_last_claim_at_v1";
const INVITE_PENDING_KEY = "pending_invite_code_v1";
let adToastTimer = null;
const adPlayingStyle = document.createElement("style");
adPlayingStyle.textContent = `
  body.ad-playing #app {
    pointer-events: none !important;
  }

  body.ad-playing .ad-overlay,
  body.ad-playing .ad-overlay * {
    pointer-events: auto !important;
  }
`;
document.head.appendChild(adPlayingStyle);
function showAdCooldownToast(message) {
  let el = document.getElementById("adCooldownToast");

  if (!el) {
    el = document.createElement("div");
    el.id = "adCooldownToast";
    el.style.cssText = `
      position: fixed;
      left: 50%;
      bottom: 120px;
      transform: translateX(-50%);
      z-index: 99999;
      background: rgba(0,0,0,0.88);
      color: #fff;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.3;
      max-width: 80vw;
      text-align: center;
      box-shadow: 0 8px 24px rgba(0,0,0,0.35);
    `;
    document.body.appendChild(el);
  }

  el.textContent = message;
  el.style.display = "block";

  clearTimeout(adToastTimer);
  adToastTimer = setTimeout(() => {
    el.style.display = "none";
  }, 1800);
}
const AUTO_AD_COOLDOWN_MS = 180000;
const AUTO_AD_LAST_KEY = "auto_ad_last";
const mysteryChestPopup = createMysteryChestPopup();
const adSurprisePopup = createMysteryChestPopup({
  title: "Surprise Box",
  subtitle: "Ad reward unlocked!",
  buttonText: "Open Surprise Box",
  requireConfirmAfterReveal: true,
  confirmButtonText: "Continue",
  revealedTitle: "Surprise Box Opened",
});
let pendingWinAdBoxReward = null;
let pendingWinAdNextLevel = false;
let winAdFlowBusy = false;
let pendingWinPopupState = null;
let postWinFlow = "idle";
let surpriseBoxRewardResult = null;
let isProcessingRewardAd = false;
let isOpeningBox = false;
let isContinuingSurprise = false;
let LAST_SERVER_TIME_MS = null;
let RANKING_REWARD_PROMPT_SHOWN = false;
function setPostWinFlow(nextFlow) {
  if (postWinFlow !== nextFlow) {
    console.debug("[surprise-box] postWinFlow", postWinFlow, "->", nextFlow);
  }
  postWinFlow = nextFlow;
}
function shouldShowAutoAd() {
  const last = Number(localStorage.getItem(AUTO_AD_LAST_KEY) || 0);
  return Date.now() - last > AUTO_AD_COOLDOWN_MS;
}

function markAutoAdShown() {
  localStorage.setItem(AUTO_AD_LAST_KEY, Date.now());
}

function getRemainingAdCooldownMs() {
  const last = Number(localStorage.getItem(AD_LAST_CLAIM_KEY) || 0);
  const remaining = AD_COOLDOWN_MS - (Date.now() - last);
  return Math.max(0, remaining);
}

function markAdClaimedNow() {
  localStorage.setItem(AD_LAST_CLAIM_KEY, String(Date.now()));
}

function guardAdCooldownBeforeWatching() {
  const remaining = getRemainingAdCooldownMs();
  if (remaining <= 0) return true;

  const seconds = Math.ceil(remaining / 1000);
  showAdCooldownToast(`Ad available in ${seconds}s`);
  return false;
}

document.body.classList.add("login-loading");
document.body.classList.remove("login-loading");
// --- LOGIN LOADING OVERLAY (blocks UI until game is ready) ---
function ensureLoginLoadingOverlay() {
  let el = document.getElementById("loginLoadingOverlay");
  if (el) return el;

  el = document.createElement("div");
  el.id = "loginLoadingOverlay";
  el.style.position = "fixed";
  el.style.inset = "0";
  el.style.zIndex = "99999";
  el.style.display = "none";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.background = "rgba(0,0,0,0.55)";
  el.innerHTML = `
    <div style="
      width:64px;height:64px;border-radius:50%;
      border:6px solid rgba(255,255,255,0.25);
      border-top-color: rgba(255,255,255,0.95);
      animation: spin 0.9s linear infinite;
    "></div>
  `;

  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);

  document.body.appendChild(el);
  return el;
}

function showLoginLoading() {
  const el = ensureLoginLoadingOverlay();
  el.style.display = "flex";

  // hide welcome overlay content (buttons/text) while loading
  document.body.classList.remove("welcome-visible");
}

function hideLoginLoading() {
  const el = document.getElementById("loginLoadingOverlay");
  if (el) el.style.display = "none";
}


document.addEventListener(
  "touchmove",
  (e) => {
    if (document.body.classList.contains("welcome-visible")) return;
    if (e.target?.closest?.(".accountScroll")) return;
    e.preventDefault();
  },
  { passive: false }
);

let levelIndex = 0;
let CURRENT_LEVEL_IS_REPLAY = false;
let RESUME_ENABLED = false;
let RESUME_TILES = new Set();
let RESUME_POS = null;
let RESUME_SAVE_TIMER = null;
let LEVEL_START_KEY = null;
let EXIT_GUARD_ENABLED = false;
let BACK_EXIT_PROMPT_OPEN = false;

function normalizeToken(t) {
  return String(t || "").replace(/^Bearer\s+/i, "");
}

function captureInviteCodeFromUrl() {
  try {
    const url = new URL(window.location.href);
    const invite = String(url.searchParams.get("invite") || "").trim();
    if (!invite) return;

    localStorage.setItem(INVITE_PENDING_KEY, invite);
    url.searchParams.delete("invite");
    window.history.replaceState({}, "", url.toString());
  } catch {}
}

function getPendingInviteCode() {
  return String(localStorage.getItem(INVITE_PENDING_KEY) || "").trim();
}

function clearPendingInviteCode() {
  localStorage.removeItem(INVITE_PENDING_KEY);
}

async function tryAutoClaimInvite() {
  const code = getPendingInviteCode();
  if (!code || !CURRENT_ACCESS_TOKEN) return;

  try {
    const res = await fetch(`${BACKEND}/api/invite/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
      },
      body: JSON.stringify({ code }),
    });

    // Server responded (ok or error), clear to avoid retry loops.
    if (res) clearPendingInviteCode();
  } catch {
    // Keep code for retry on next successful online session.
  }
}

function showPiBrowserRequiredBlocker() {
  const existing = document.getElementById("piBrowserRequiredOverlay");
  if (existing) return;

  const overlay = document.createElement("div");
  overlay.id = "piBrowserRequiredOverlay";
  overlay.style.cssText = [
    "position: fixed",
    "inset: 0",
    "z-index: 1000000",
    "background: linear-gradient(180deg, rgba(8,12,22,0.98), rgba(10,16,34,0.98))",
    "display: flex",
    "align-items: center",
    "justify-content: center",
    "padding: 16px",
    "color: #fff",
  ].join(";");

  const card = document.createElement("div");
  card.style.cssText = [
    "width: min(560px, 100%)",
    "border-radius: 18px",
    "border: 1px solid rgba(120,220,255,0.35)",
    "background: rgba(12,20,40,0.96)",
    "box-shadow: 0 20px 60px rgba(0,0,0,0.45)",
    "padding: 18px",
    "line-height: 1.45",
  ].join(";");

  card.innerHTML =
    '<div style="font-size:22px;font-weight:900;margin-bottom:8px;">Pi Browser Required</div>' +
    '<div style="font-size:14px;opacity:.92;margin-bottom:14px;">This game only works inside <b>Pi Browser</b> with Pi SDK.</div>' +
    '<div style="font-size:14px;margin-bottom:8px;font-weight:700;">How to open:</div>' +
    '<ol style="margin:0 0 14px 18px;padding:0;font-size:13px;opacity:.9;">' +
    '<li>Install the Pi Network app on your phone.</li>' +
    '<li>Create your Pi account (or sign in).</li>' +
    '<li>Open Pi Browser from inside the Pi app.</li>' +
    '<li>Open this game URL in Pi Browser.</li>' +
    '</ol>' +
    '<div style="font-size:12px;opacity:.8;">If you already have Pi Browser open, refresh this page there.</div>';

  overlay.appendChild(card);
  document.body.appendChild(overlay);
}


function isLikelyPiBrowser() {
  const ua = String(navigator?.userAgent || "");
  return /pibrowser|pi browser/i.test(ua);
}

function hasPiSdkRuntime() {
  try {
    return !!(window.Pi && typeof window.Pi.authenticate === "function");
  } catch {
    return false;
  }
}

function isSandboxOrDevHost() {
  const host = String(window?.location?.hostname || "").toLowerCase();
  if (!host) return false;

  // Allow local/dev/sandbox testing outside Pi Browser.
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    host.includes("sandbox") ||
    host.includes("webcontainer")
  ) {
    return true;
  }

  return false;
}


function isPiSandboxMode() {
  try {
    const host = String(window?.location?.hostname || "").toLowerCase();
    const path = String(window?.location?.pathname || "").toLowerCase();
    const search = String(window?.location?.search || "").toLowerCase();
    return (
      host.includes("sandbox") ||
      path.includes("sandbox") ||
      search.includes("sandbox")
    );
  } catch {
    return false;
  }
}

async function canRunInCurrentEnvironment() {
  // Keep local/dev/sandbox usable for testing.
  if (isSandboxOrDevHost() || isPiSandboxMode()) return true;

  // Fast path.
  if (hasPiSdkRuntime() || isLikelyPiBrowser()) return true;

  // Pi SDK injection can be delayed in some Pi Browser launches.
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 100));
    if (hasPiSdkRuntime()) return true;
  }

  return false;
}
function applyUserPatch(patch, opts = {}) {
  if (!patch) return;
  const skipCoinSync = Boolean(opts?.skipCoinSync);
  const skipScoreSync = Boolean(opts?.skipScoreSync);

  const keepUid = CURRENT_USER?.uid;
  const keepName = CURRENT_USER?.username;

  CURRENT_USER = { ...CURRENT_USER, ...patch };

  if (Number.isFinite(Number(CURRENT_USER?.server_time_ms))) {
    setGlobalServerTime(Number(CURRENT_USER.server_time_ms));
  }

  // never allow identity to be wiped by partial backend patches
  if (!CURRENT_USER?.uid && keepUid) CURRENT_USER.uid = keepUid;
  if (!CURRENT_USER?.username && keepName) CURRENT_USER.username = keepName;

  const completedLevels = patch?.completedLevels ?? patch?.completed_levels;
  if (Array.isArray(completedLevels)) {
    CURRENT_COMPLETED_LEVELS = new Set(
      completedLevels
        .map((level) => Number(level))
        .filter((level) => Number.isInteger(level) && level > 0)
    );
    CURRENT_USER.completedLevels = Array.from(CURRENT_COMPLETED_LEVELS);
    CURRENT_USER.completed_levels = Array.from(CURRENT_COMPLETED_LEVELS);
  }

  // update header
  ui?.setUser?.(CURRENT_USER);
  if (!skipScoreSync) {
    ui?.setScore?.(CURRENT_USER?.score ?? CURRENT_USER?.rp_score ?? 0);
  }
  if (!skipCoinSync) {
    ui?.setCoins?.(CURRENT_USER?.coins ?? 0);
  }
  refreshLevelsAccessUI();

  updateAllBadges();
}

function normalizeLevelAccess(source) {
  const access = source?.levelAccess || source || {};
  const dailyLevelsPlayed = Number(
    access?.dailyLevelsPlayed ??
    access?.daily_levels_played ??
    CURRENT_USER?.dailyLevelsPlayed ??
    CURRENT_USER?.daily_levels_played ??
    0
  );
  const dailyLevelsUnlocked = Number(
    access?.dailyLevelsUnlocked ??
    access?.daily_levels_unlocked ??
    CURRENT_USER?.dailyLevelsUnlocked ??
    CURRENT_USER?.daily_levels_unlocked ??
    access?.initialDailyUnlockedLevels ??
    access?.initial_daily_unlocked_levels ??
    CURRENT_USER?.initialDailyUnlockedLevels ??
    CURRENT_USER?.initial_daily_unlocked_levels ??
    LEVEL_ACCESS_DEFAULTS.initialDailyUnlockedLevels
  );
  const dailyLevelsMax = Number(
    access?.dailyLevelsMax ??
    access?.daily_levels_max ??
    CURRENT_USER?.dailyLevelsMax ??
    CURRENT_USER?.daily_levels_max ??
    LEVEL_ACCESS_DEFAULTS.dailyLevelsMax
  );
  const nextUnlockAt =
    access?.nextUnlockAt ??
    access?.next_unlock_at ??
    CURRENT_USER?.nextUnlockAt ??
    CURRENT_USER?.next_unlock_at ??
    null;
  const initialDailyUnlockedLevels = Number(
    access?.initialDailyUnlockedLevels ??
    access?.initial_daily_unlocked_levels ??
    CURRENT_USER?.initialDailyUnlockedLevels ??
    CURRENT_USER?.initial_daily_unlocked_levels ??
    dailyLevelsUnlocked
  );
  const unlockIntervalSeconds = Number(
    access?.unlockIntervalSeconds ??
    access?.unlock_interval_seconds ??
    CURRENT_USER?.unlockIntervalSeconds ??
    CURRENT_USER?.unlock_interval_seconds ??
    LEVEL_ACCESS_DEFAULTS.unlockIntervalSeconds
  );
  const unlockLevelsPerInterval = Number(
    access?.unlockLevelsPerInterval ??
    access?.unlock_levels_per_interval ??
    CURRENT_USER?.unlockLevelsPerInterval ??
    CURRENT_USER?.unlock_levels_per_interval ??
    LEVEL_ACCESS_DEFAULTS.unlockLevelsPerInterval
  );
  const adUnlockLevels = Number(
    access?.adUnlockLevels ??
    access?.ad_unlock_levels ??
    CURRENT_USER?.adUnlockLevels ??
    CURRENT_USER?.ad_unlock_levels ??
    LEVEL_ACCESS_DEFAULTS.adUnlockLevels
  );

  return {
    dailyLevelsPlayed,
    dailyLevelsUnlocked,
    dailyLevelsMax,
    initialDailyUnlockedLevels,
    nextUnlockAt,
    unlockIntervalSeconds,
    unlockLevelsPerInterval,
    adUnlockLevels,
    isDailyCapReached: Boolean(access?.isDailyCapReached ?? access?.is_daily_cap_reached ?? (dailyLevelsPlayed >= dailyLevelsMax)),
    isWaitingForUnlock: Boolean(access?.isWaitingForUnlock ?? access?.is_waiting_for_unlock ?? (dailyLevelsPlayed >= dailyLevelsUnlocked && dailyLevelsUnlocked < dailyLevelsMax && dailyLevelsPlayed < dailyLevelsMax)),
    canUnlockWithAd: Boolean(access?.canUnlockWithAd ?? access?.can_unlock_with_ad),
    canWatchAdToUnlock: Boolean(access?.canWatchAdToUnlock ?? access?.can_watch_ad_to_unlock),
    canPlayNow: Boolean(access?.canPlayNow ?? access?.can_play_now ?? (dailyLevelsPlayed < dailyLevelsUnlocked && dailyLevelsPlayed < dailyLevelsMax)),
    dailyLimitReached: Boolean(access?.dailyLimitReached ?? access?.daily_limit_reached ?? (dailyLevelsPlayed >= dailyLevelsMax)),
  };
}

function refreshLevelsAccessUI() {
  const access = normalizeLevelAccess(CURRENT_USER);
  levelsUI?.setLevelAccess?.(access);
  return access;
}
let COIN_ANIM_SEQ = 0;
let COIN_GAIN_TIMER = null;
let SCORE_ANIM_SEQ = 0;
let SCORE_GAIN_TIMER = null;

function getDisplayedCoins() {
  const el = document.getElementById("coinCount");
  const n = Number(el?.textContent ?? CURRENT_USER?.coins ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function getDisplayedScore() {
  const el = document.getElementById("scoreCount");
  const n = Number(el?.textContent ?? CURRENT_USER?.score ?? CURRENT_USER?.rp_score ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readServerTimeFromHeaders(res) {
  try {
    const raw = res?.headers?.get?.("date");
    if (!raw) return null;
    const ms = Date.parse(raw);
    if (!Number.isFinite(ms)) return null;
    return ms;
  } catch {
    return null;
  }
}

function setGlobalServerTime(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n)) return;
  LAST_SERVER_TIME_MS = n;
  ui?.setServerTime?.(n);
}


function hasBlockingOverlayForRankingReward() {
  return Boolean(
    document.querySelector(".daily-reward-overlay:not(.hidden):not(.daily-ranking-reward-overlay)") ||
    document.querySelector(".winOverlay.show")
  );
}

async function maybeShowDailyRankingRewardPopup() {
  if (RANKING_REWARD_PROMPT_SHOWN) return;
  if (!CURRENT_ACCESS_TOKEN) return;

  try {
    const out = await apiLeaderboardRewardMe();
    if (!out?.ok || !out?.available || !out?.row) return;

    const row = out.row;
    const rank = Number(row.rank || 0);
    const rewardCoins = Number(row.reward_coins || 0);
    if (!rank || rewardCoins <= 0) return;

    if (hasBlockingOverlayForRankingReward()) {
      setTimeout(() => { void maybeShowDailyRankingRewardPopup(); }, 2500);
      return;
    }

    RANKING_REWARD_PROMPT_SHOWN = true;
    dailyRankingRewardPopup.show({ rank, rewardCoins, dateKey: row.date_key });
  } catch {}
}

function showBackExitPopup() {
  return new Promise((resolve) => {
    if (BACK_EXIT_PROMPT_OPEN) return resolve(false);
    BACK_EXIT_PROMPT_OPEN = true;
    playAudio("back_btn");

    const overlay = document.createElement("div");
    overlay.style.cssText = "position: fixed; inset: 0; z-index: 100000; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; padding: 16px;";

    const card = document.createElement("div");
    card.style.cssText = "width: min(420px, 100%); border-radius: 16px; border: 1px solid rgba(255,255,255,0.15); background: rgba(12,16,30,0.96); color: #fff; box-shadow: 0 18px 50px rgba(0,0,0,0.45); padding: 16px;";

    card.innerHTML = '<div style="font-size:18px;font-weight:800;margin-bottom:8px;">Exit Game?</div>' + '<div style="font-size:14px;opacity:.92;line-height:1.35;margin-bottom:14px;">Do you really want to exit the game?</div>' + '<div style="display:flex;gap:8px;justify-content:flex-end;">' + '<button id="stayGameBtn" style="border:1px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.08);color:#fff;border-radius:10px;padding:8px 12px;">Stay</button>' + '<button id="exitGameBtn" style="border:1px solid rgba(62,214,255,0.45);background:linear-gradient(180deg, rgba(62,214,255,1), rgba(30,166,255,1));color:#051322;border-radius:10px;padding:8px 12px;font-weight:700;">Exit</button>' + '</div>';

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const cleanup = (value) => {
      BACK_EXIT_PROMPT_OPEN = false;
      overlay.remove();
      resolve(value);
    };

    card.querySelector("#stayGameBtn")?.addEventListener("click", () => cleanup(false));
    card.querySelector("#exitGameBtn")?.addEventListener("click", () => cleanup(true));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) cleanup(false);
    });
  });
}

function enableBackExitGuard() {
  if (EXIT_GUARD_ENABLED) return;
  EXIT_GUARD_ENABLED = true;

  // Add one extra history entry so back can be intercepted in-game.
  try {
    window.history.pushState({ mazeBackGuard: true }, "");
  } catch {}

  window.addEventListener("popstate", () => {
    showBackExitPopup().then((shouldExit) => {
      if (shouldExit) {
        // Leave game by going back once more in history.
        EXIT_GUARD_ENABLED = false;
        window.history.back();
        return;
      }

      // Keep user in game by restoring guard state.
      try {
        window.history.pushState({ mazeBackGuard: true }, "");
      } catch {}
    });
  });
}

function showCoinGainFX(delta) {
  if (!Number.isFinite(delta) || delta <= 0) return;

  const coinsPill = document.querySelector(".coins");
  if (!coinsPill) return;

  const old = document.getElementById("coinGainFX");
  if (old) old.remove();

  const rect = coinsPill.getBoundingClientRect();
  const fx = document.createElement("div");
  fx.id = "coinGainFX";
  fx.className = "coin-gain-fx";
  fx.innerHTML = `
    <span class="coin-gain-sparkle">?</span>
    <span class="coin-gain-amount">+${Math.floor(delta)} coins</span>
  `;
  fx.style.left = String(Math.round(rect.left + rect.width / 2)) + "px";
  fx.style.top = String(Math.round(rect.top - 8)) + "px";
  document.body.appendChild(fx);

  coinsPill.classList.remove("coin-gain-pulse");
  void coinsPill.offsetWidth;
  coinsPill.classList.add("coin-gain-pulse");

  clearTimeout(COIN_GAIN_TIMER);
  COIN_GAIN_TIMER = setTimeout(() => {
    coinsPill.classList.remove("coin-gain-pulse");
    fx.remove();
  }, 3300);
}

async function animateCoinsTo(target, opts = {}) {
  const finalValue = Math.max(0, Math.floor(Number(target || 0)));
  const delayMs = Math.max(0, Number(opts?.delayMs || 0));
  const startValue = getDisplayedCoins();
  const delta = finalValue - startValue;

  if (delayMs > 0) await sleep(delayMs);

  if (delta > 0 && opts?.showGainFx !== false) {
    playAudio("coins_gain");
    showCoinGainFX(delta);
  }

  if (startValue === finalValue) {
    ui?.setCoins?.(finalValue);
    if (CURRENT_USER) CURRENT_USER.coins = finalValue;
    return;
  }

  const seq = ++COIN_ANIM_SEQ;
  const duration = Math.max(650, Math.min(1800, 850 + Math.abs(delta) * 14));
  const startedAt = performance.now();

  await new Promise((resolve) => {
    const step = (now) => {
      if (seq !== COIN_ANIM_SEQ) return resolve();
      const tt = Math.min(1, (now - startedAt) / duration);
      const eased = tt === 1 ? 1 : 1 - Math.pow(2, -10 * tt);
      const current = Math.round(startValue + delta * eased);
      ui?.setCoins?.(current);

      if (tt < 1) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(step);
  });

  ui?.setCoins?.(finalValue);
  if (CURRENT_USER) CURRENT_USER.coins = finalValue;
}

function showScoreGainFX(delta) {
  if (!Number.isFinite(delta) || delta <= 0) return;

  const scoreEl = document.getElementById("scoreCount");
  const scorePill = scoreEl?.closest(".economyStat");
  if (!scoreEl || !scorePill) return;

  const old = document.getElementById("scoreGainFX");
  if (old) old.remove();

  const rect = scorePill.getBoundingClientRect();
  const fx = document.createElement("div");
  fx.id = "scoreGainFX";
  fx.className = "score-gain-fx";
  fx.innerHTML = `<span class="score-gain-amount">+${Math.floor(delta)} score</span>`;
  fx.style.left = String(Math.round(rect.left + rect.width / 2)) + "px";
  fx.style.top = String(Math.round(rect.top - 8)) + "px";
  document.body.appendChild(fx);

  scorePill.classList.remove("score-gain-pulse");
  void scorePill.offsetWidth;
  scorePill.classList.add("score-gain-pulse");

  clearTimeout(SCORE_GAIN_TIMER);
  SCORE_GAIN_TIMER = setTimeout(() => {
    scorePill.classList.remove("score-gain-pulse");
    fx.remove();
  }, 2600);
}

async function animateScoreTo(target, opts = {}) {
  const finalValue = Math.max(0, Math.floor(Number(target || 0)));
  const delayMs = Math.max(0, Number(opts?.delayMs || 0));
  const startValue = getDisplayedScore();
  const delta = finalValue - startValue;

  if (delayMs > 0) await sleep(delayMs);

  if (delta > 0 && opts?.showGainFx !== false) {
    showScoreGainFX(delta);
  }

  if (startValue === finalValue) {
    ui?.setScore?.(finalValue);
    if (CURRENT_USER) CURRENT_USER.score = finalValue;
    return;
  }

  const seq = ++SCORE_ANIM_SEQ;
  const duration = Math.max(650, Math.min(1800, 850 + Math.abs(delta) * 18));
  const startedAt = performance.now();

  await new Promise((resolve) => {
    const step = (now) => {
      if (seq !== SCORE_ANIM_SEQ) return resolve();
      const tt = Math.min(1, (now - startedAt) / duration);
      const eased = tt === 1 ? 1 : 1 - Math.pow(2, -10 * tt);
      const current = Math.round(startValue + delta * eased);
      ui?.setScore?.(current);

      if (tt < 1) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(step);
  });

  ui?.setScore?.(finalValue);
  if (CURRENT_USER) {
    CURRENT_USER.score = finalValue;
    CURRENT_USER.rp_score = finalValue;
  }
}
function scheduleResumeSave(currentLevelNumber) {
  if (!CURRENT_ACCESS_TOKEN) return;
  if (!RESUME_ENABLED) return;
  if (RESUME_SAVE_TIMER) return;

  RESUME_SAVE_TIMER = setTimeout(() => {
    RESUME_SAVE_TIMER = null;

    const safeLevel = Math.max(
      Number(CURRENT_MAX_UNLOCKED_LEVEL || 1),
      Number(currentLevelNumber || 1)
    );
if (LEVEL_START_KEY) {
  RESUME_TILES.add(LEVEL_START_KEY);
}
    console.log(
      "SAVING RESUME",
      safeLevel,
      RESUME_TILES.size,
      RESUME_POS
    );
    
    if (!CURRENT_USER?.uid) return;

apiSetProgress({
  uid: CURRENT_USER.uid,
      level: safeLevel,
      paintedKeys: Array.from(RESUME_TILES),
      resume: RESUME_POS,
    }).catch(() => {});
  }, 700);
}
// Keep the Levels 1screen consistent (guest: localStorage, logged-in: backend)
let CURRENT_MAX_UNLOCKED_LEVEL = 1;

async function fetchAndSetCoins({ BACKEND, token, ui }) {
  if (!token) return;

  const res = await fetch(`${BACKEND}/api/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) return;

  const data = await res.json();
  ui.setCoins(data.coins ?? 0);
}

async function apiSetProgress({ uid, level, paintedKeys, resume } = {}) {
  if (!CURRENT_ACCESS_TOKEN) return null;

  const res = await fetch(`${BACKEND}/api/progress`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
    },
    body: JSON.stringify({
      uid,
      level,
      paintedKeys,
      resume,
    }),
  });

  return res.json().catch(() => ({}));
}
async function apiClaimLevelComplete(levelNumber) {
  if (!CURRENT_ACCESS_TOKEN) return null;

  const res = await fetch(`${BACKEND}/api/rewards/level-complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
    },
    body: JSON.stringify({
      level: levelNumber,
    }),
  });

  return res.json().catch(() => ({ ok: false, error: "level_complete_failed" }));
}

async function apiUnlockLevelsByAd() {
  if (!CURRENT_ACCESS_TOKEN) {
    throw new Error("No access token");
  }

  const res = await fetch(`${BACKEND}/api/levels/ad-unlock`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
    },
  });

  const out = await res.json().catch(() => ({}));
  if (!res.ok || !out?.ok) {
    const error = out?.error || "level_ad_unlock_failed";
    const err = new Error(error);
    err.levelAccess = out?.levelAccess || null;
    throw err;
  }

  return out;
}

function buildLevelCompletePopupState(out, levelNumber) {
  const rewards = out?.rewards
    ? {
        mc: Number(out.rewards.mc || 0),
        rp: Number(out.rewards.rp || 0),
      }
    : null;

  let rewardStatus = "";
  let rewardNote = "";

  if (rewards) {
      if (out?.isReplay) {
        rewardStatus = "Replay completed.";
        rewardNote = "No Coins or Score earned on replay.";
      } else if (out?.already) {
        rewardStatus = "This level already gave Score this month.";
        rewardNote = "Score affects your leaderboard position and monthly rewards.";
      } else if (rewards.rp >= 2) {
      rewardStatus = "Clean run bonus applied.";
      rewardNote = "Score affects your leaderboard position and monthly rewards.";
    } else if (rewards.rp === 1) {
      rewardStatus = "Hint used: reduced Score.";
      rewardNote = "Hints reduce Score for this run.";
    } else if (rewards.rp === 0) {
      rewardStatus = "No Score awarded for this run.";
      rewardNote = "Skipped levels do not award Score.";
    }
  }

  return {
    levelNumber,
    rewards,
    rewardStatus,
    rewardNote,
  };
}

async function apiLeaderboardMonthly(params = {}) {
  const qs = new URLSearchParams();
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await fetch(`${BACKEND}/api/leaderboard${suffix}`, {
    headers: {
      ...(CURRENT_ACCESS_TOKEN ? { Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}` } : {}),
    },
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok || out?.ok === false) {
    throw new Error(out?.error || "leaderboard_failed");
  }
  return out;
}

async function apiLeaderboardMonthlyMe() {
  if (!CURRENT_ACCESS_TOKEN) {
    return {
      ok: true,
      monthKey: null,
      uid: CURRENT_USER?.uid || null,
      rpScore: Number(CURRENT_USER?.score || 0),
      dailyRp: Number(CURRENT_USER?.dailyRp ?? CURRENT_USER?.daily_rp ?? 0),
      currentRank: null,
      projectedTierName: null,
      projectedTierLabel: null,
      nextTierName: null,
      rpNeededForNextTier: null,
    };
  }

  const res = await fetch(`${BACKEND}/api/leaderboard/me`, {
    headers: {
      Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
    },
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok || out?.ok === false) {
    throw new Error(out?.error || "leaderboard_me_failed");
  }
  return out;
}

async function apiLeaderboardRewardMe() {
  if (!CURRENT_ACCESS_TOKEN) return { ok: true, available: false };

  const res = await fetch(`${BACKEND}/api/leaderboard/daily-reward/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
    },
  });

  const out = await res.json().catch(() => ({}));
  if (!res.ok || !out?.ok) {
    return { ok: false, error: out?.error || "daily_reward_lookup_failed", available: false };
  }

  return out;
}

async function apiClaimLeaderboardReward() {
  if (!CURRENT_ACCESS_TOKEN) return { ok: false, error: "auth_required" };

  const res = await fetch(`${BACKEND}/api/leaderboard/daily-reward/claim`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
    },
  });

  const out = await res.json().catch(() => ({}));
  if (!res.ok || !out?.ok) {
    return { ok: false, error: out?.error || "daily_reward_claim_failed" };
  }

  return out;
}

function updateBadge({ badgeId, left }) {
  const badge = document.getElementById(badgeId);
  if (!badge) return;

  if (left > 0) {
    badge.textContent = left;
    badge.classList.remove("hidden");
  } else {
    badge.textContent = "";
    badge.classList.add("hidden");
  }
}


async function apiSkip({ mode }) {
  const nonce = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  const res = await fetch(`${BACKEND}/api/skip`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
    },
    body: JSON.stringify({ mode, nonce }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) throw new Error(data?.error || "Skip failed");
  return data;
}

async function apiHint({ mode }) {
  const nonce = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  const res = await fetch(`${BACKEND}/api/hint`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
    },
    body: JSON.stringify({ mode, nonce }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) throw new Error(data?.error || "Hint failed");
  return data;
}

async function apiClaimAd50() {
  if (!CURRENT_ACCESS_TOKEN) {
    throw new Error("No access token");
  }

  const res = await fetch(`${BACKEND}/api/rewards/ad-50`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
    },
    body: JSON.stringify({
      nonce: `${Date.now()}-${Math.random()}`,
    }),
  });

  if (!res.ok) {
    throw new Error("Ad reward failed");
  }

  return res.json();
}

async function apiOpenSurpriseBox() {
  if (!CURRENT_ACCESS_TOKEN) {
    throw new Error("No access token");
  }

  const res = await fetch(`${BACKEND}/api/surprise-box/open`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
    },
  });

  const out = await res.json().catch(() => ({}));
  if (!res.ok || (!out?.ok && !out?.success)) {
    const err = new Error(out?.error || "Surprise Box failed");
    err.surpriseBoxState = out?.surpriseBoxState || null;
    throw err;
  }
  return out;
}

async function loadMeAndSyncUI({ BACKEND, token, ui }) {
  const res = await fetch(`${BACKEND}/api/me`, {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${normalizeToken(token)}`,
    "Content-Type": "application/json"
  },
});

  if (!res.ok) {
  console.warn("Failed /api/me", res.status);
  return { user: CURRENT_USER, progress: null };
}

  const me = await res.json();

  const user = me?.user || {};
  const progress = me?.progress || {};
  const levelAccess = normalizeLevelAccess(me?.levelAccess || user);
  const completedLevels = Array.isArray(me?.completedLevels)
    ? me.completedLevels
    : Array.isArray(user?.completed_levels)
      ? user.completed_levels
      : Array.isArray(user?.completedLevels)
        ? user.completedLevels
        : [];
  CURRENT_COMPLETED_LEVELS = new Set(
    completedLevels
      .map((level) => Number(level))
      .filter((level) => Number.isInteger(level) && level > 0)
  );

  CURRENT_USER = {
    ...user,
    ...progress,

  uid: user.uid,
  username: user.username,

  // normalize everything
  coins: Number(user.coins ?? progress.coins ?? 0),
  score: Number(user.score ?? user.rp_score ?? 0),
  dailyRp: Number(user.dailyRp ?? user.daily_rp ?? 0),

  restarts_balance: Number(user.restarts_balance ?? 0),
  skips_balance: Number(user.skips_balance ?? 0),
  hints_balance: Number(user.hints_balance ?? 0),

  free_restarts_used: Number(progress.free_restarts_used ?? 0),
  free_skips_used: Number(progress.free_skips_used ?? 0),
  free_hints_used: Number(progress.free_hints_used ?? 0),

  monthly_final_rate: Number(user.monthly_final_rate ?? 50),
  monthly_rate_breakdown: user.monthly_rate_breakdown ?? {},
  monthly_login_days: Number(user.monthly_login_days ?? 0),
  monthly_levels_completed: Number(user.monthly_levels_completed ?? 0),
  monthly_skips_used: Number(user.monthly_skips_used ?? 0),
  monthly_hints_used: Number(user.monthly_hints_used ?? 0),
  monthly_restarts_used: Number(user.monthly_restarts_used ?? 0),
  monthly_surprise_boxes_opened: Number(user.monthly_surprise_boxes_opened ?? 0),
  monthly_mystery_boxes_opened: Number(user.monthly_mystery_boxes_opened ?? 0),
  daily_surprise_boxes_opened: Number(user.daily_surprise_boxes_opened ?? 0),
  daily_surprise_boxes_max: Number(user.daily_surprise_boxes_max ?? 4),
  daily_surprise_boxes_remaining: Number(user.daily_surprise_boxes_remaining ?? Math.max(0, Number(user.daily_surprise_boxes_max ?? 4) - Number(user.daily_surprise_boxes_opened ?? 0))),
  monthly_valid_invites: Number(user.monthly_valid_invites ?? 0),
  lifetime_valid_invites: Number(user.lifetime_valid_invites ?? 0),
  invite_code: user.invite_code ?? null,
  pi_wallet_identifier: user.pi_wallet_identifier ?? null,
  wallet_verified: Boolean(user.wallet_verified),
  wallet_last_updated_at: user.wallet_last_updated_at ?? null,
  dailyLevelsPlayed: levelAccess.dailyLevelsPlayed,
  dailyLevelsUnlocked: levelAccess.dailyLevelsUnlocked,
  dailyLevelsMax: levelAccess.dailyLevelsMax,
  initialDailyUnlockedLevels: levelAccess.initialDailyUnlockedLevels,
  nextUnlockAt: levelAccess.nextUnlockAt,
  unlockIntervalSeconds: levelAccess.unlockIntervalSeconds,
  unlockLevelsPerInterval: levelAccess.unlockLevelsPerInterval,
  adUnlockLevels: levelAccess.adUnlockLevels,
    canWatchAdToUnlock: levelAccess.canWatchAdToUnlock,
    canPlayNow: levelAccess.canPlayNow,
    dailyLimitReached: levelAccess.dailyLimitReached,
    completedLevels: Array.from(CURRENT_COMPLETED_LEVELS),
    completed_levels: Array.from(CURRENT_COMPLETED_LEVELS),
  };
  ui.setUser({
    ...CURRENT_USER,
    level: Number(progress.level || 1),
  });

  ui.setCoins(Number(user.coins ?? progress.coins ?? 0));
  ui.setScore(Number(user.score ?? user.rp_score ?? 0));
  refreshLevelsAccessUI();
  
setTimeout(() => {
  updateAllBadges();
}, 0);
return me;
}

function updateAllBadges() {
  if (!CURRENT_USER) return;

  const FREE_SKIP_LIMIT = 3;
  const FREE_HINT_LIMIT = 3;
  const FREE_RESTART_LIMIT = 3;

  const freeSkipsLeft =
    FREE_SKIP_LIMIT - (CURRENT_USER.free_skips_used ?? 0);
  const freeHintsLeft =
    FREE_HINT_LIMIT - (CURRENT_USER.free_hints_used ?? 0);
  const freeRestartsLeft =
    FREE_RESTART_LIMIT - (CURRENT_USER.free_restarts_used ?? 0);

  const totalSkips =
    Math.max(0, freeSkipsLeft) +
    (CURRENT_USER.skips_balance ?? 0);

  const totalHints =
    Math.max(0, freeHintsLeft) +
    (CURRENT_USER.hints_balance ?? 0);

  const totalRestarts =
    Math.max(0, freeRestartsLeft) +
    (CURRENT_USER.restarts_balance ?? 0);

  ui?.setSkipsBadge?.(totalSkips);
  ui?.setHintsBadge?.(totalHints);
  ui?.setRestartsBadge?.(totalRestarts);
}


async function apiRestart({ mode }) {
  const nonce = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  const res = await fetch(`${BACKEND}/api/restart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
    },
    body: JSON.stringify({ mode, nonce }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) throw new Error(data?.error || "Restart failed");
  return data;
}
function freeRestartsLeft() {
  const used = Number(CURRENT_USER?.free_restarts_used || 0);
  return Math.max(0, FREE_RESTARTS - used);
}
function freeSkipsLeft() {
  const used = Number(CURRENT_USER?.free_skips_used || 0);
  return Math.max(0, FREE_SKIPS - used);
}

function freeHintsLeft() {
  const used = Number(CURRENT_USER?.free_hints_used || 0);
  return Math.max(0, FREE_HINTS - used);
}
function loadGuestProgress() {
  try {
    const raw = localStorage.getItem(GUEST_PROGRESS_KEY);
    if (!raw) return { maxLevel: 1 };
    return JSON.parse(raw);
  } catch (e) {
    return { maxLevel: 1 };
  }
}

function saveGuestProgress(maxLevel) {
  const capped = Math.min(maxLevel, GUEST_MAX_LEVEL);
  localStorage.setItem(
    GUEST_PROGRESS_KEY,
    JSON.stringify({ maxLevel: capped })
  );
}

async function boot() {
  enableBackExitGuard();
  captureInviteCodeFromUrl();
  let piInitFailed = false;
    // Ensure Pi SDK is initialized before login can happen
  try {
    if (window.Pi && !window.__PI_INITIALIZED__) {
      await window.Pi.init({ version: "2.0" });
      window.__PI_INITIALIZED__ = true;
      console.log("Pi SDK initialized");
    }
  } catch (e) {
    piInitFailed = true;
    console.warn("Pi SDK init failed", e);
  }
    const storedToken = localStorage.getItem("pi_access_token");

if (storedToken) {
  CURRENT_ACCESS_TOKEN = normalizeToken(storedToken);
} else {
  CURRENT_ACCESS_TOKEN = null;
}

// never show a "logged-in" user until backend validates token
CURRENT_USER = null;
CURRENT_COMPLETED_LEVELS = new Set();
ui?.setUser?.({ username: "Guest", uid: null });
ui?.setCoins?.(0);
ui?.setScore?.(0);
// ?? AUTO-HYDRATE USER IF TOKEN EXISTS

  const root = document.querySelector("#app");
  if (!root) {
    document.body.innerHTML = "<h1>#app not found</h1>";
    return;
  }
  // Mount UI
     ui = mountUI(root);

const allowRuntime = await canRunInCurrentEnvironment();

if (!allowRuntime) {
  showPiBrowserRequiredBlocker();
  return;
}
if (CURRENT_ACCESS_TOKEN) {
  try {
    const me = await loadMeAndSyncUI({
      BACKEND,
      token: CURRENT_ACCESS_TOKEN,
      ui,
    });

    if (me?.user) {
  await tryAutoClaimInvite();
  document.body.classList.add("game-running");

  const unlocked = Number(me?.progress?.level || 1);
  CURRENT_MAX_UNLOCKED_LEVEL = Math.max(1, unlocked);
  levelsUI.setUnlocked?.(CURRENT_MAX_UNLOCKED_LEVEL);

  // enable resume for logged-in users
  RESUME_ENABLED = true;

  // restore saved path + position from backend
  const paintedKeys = me?.progress?.paintedKeys;
  const resume = me?.progress?.resume;

  RESUME_TILES = new Set(Array.isArray(paintedKeys) ? paintedKeys : []);
  RESUME_POS =
    resume && resume.x != null && resume.y != null
      ? { x: resume.x, y: resume.y }
      : null;

if (!game?.isRunning?.()) {
  game.start();
}

// go to the last unlocked level (where resume is stored)
goToLevel(CURRENT_MAX_UNLOCKED_LEVEL - 1);

// ? APPLY PROGRESS AFTER GAME IS RUNNING + LEVEL IS SET
setTimeout(() => {
  if (RESUME_TILES.size > 0 || RESUME_POS) {
    game.applyProgress({
      paintedKeys: Array.from(RESUME_TILES),
      player: RESUME_POS,
    });
  }
}, 0);
setTimeout(() => {
  void maybeShowDailyRankingRewardPopup();
}, 1200);
}
     else {
      throw new Error("Invalid session");
     }
  } catch (e) {
    console.warn("Token invalid during boot");
    CURRENT_ACCESS_TOKEN = null;
    CURRENT_USER = null;
    CURRENT_COMPLETED_LEVELS = new Set();
    localStorage.removeItem("pi_access_token");
    document.body.classList.add("welcome-visible");
  }
}
// expose a prestart hook so ui.js can start Pi auth on touchstart (fixes 2-tap on mobile)
window.__maze = window.__maze || {};
window.__maze.prestartLogin = () => {
  try {
    // import at top:  import { ensurePiLogin, prestartPiLogin } from "./pi/piClient.js";
    prestartPiLogin(BACKEND);
  } catch {}
};

// Expose a tiny bridge for UI modules that don't have direct access to `ui`.
// (Used by the Levels screen to show "Login required" for locked guest levels.)
window.__maze = window.__maze || {};
window.__maze.guestMaxLevel = GUEST_MAX_LEVEL;
window.__maze.showLoginRequired = () => ui.showLoginRequired();
window.__maze.isLoggedIn = () => Boolean(CURRENT_ACCESS_TOKEN);
window.__maze.openSurpriseBox = async () => {
  return startSurpriseBoxFlow({ goNextLevelAfter: false });
};
window.__maze.setWallet = async (wallet) => {
  if (!CURRENT_ACCESS_TOKEN) return { ok: false, error: "auth_required" };

  const res = await fetch(`${BACKEND}/api/user/set-wallet`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
    },
    body: JSON.stringify({ wallet }),
  });

  const out = await res.json().catch(() => ({}));
  if (!res.ok || !out?.ok) {
    return { ok: false, error: out?.error || "set_wallet_failed" };
  }

  try {
    await loadMeAndSyncUI({ BACKEND, token: CURRENT_ACCESS_TOKEN, ui });
  } catch {}

  return out;
};

window.__maze.getLeaderboard = async (params = {}) => {
  try {
    return await apiLeaderboardMonthly(params);
  } catch (e) {
    return { ok: false, error: e?.message || "leaderboard_failed", monthKey: null, totalEligibleUsers: 0, tierCutoffs: [], items: [] };
  }
};

window.__maze.getMyLeaderboardSummary = async () => {
  try {
    return await apiLeaderboardMonthlyMe();
  } catch (e) {
    return {
      ok: false,
      error: e?.message || "leaderboard_me_failed",
      monthKey: null,
      uid: CURRENT_USER?.uid || null,
      rpScore: Number(CURRENT_USER?.score || 0),
      dailyRp: Number(CURRENT_USER?.dailyRp ?? CURRENT_USER?.daily_rp ?? 0),
      currentRank: null,
      projectedTierName: null,
      projectedTierLabel: null,
      nextTierName: null,
      rpNeededForNextTier: null,
      tierCutoffs: [],
    };
  }
};

const winPopup = createWinPopup();
const skipPopup = createSkipPopup();
const hintPopup = createHintPopup();
const restartPopup = createRestartPopup();
const dailyRankingRewardPopup = createDailyRankingRewardPopup();

function withPopupAudio(popupApi) {
  if (!popupApi) return;

  if (typeof popupApi.show === "function") {
    const originalShow = popupApi.show.bind(popupApi);
    popupApi.show = (...args) => {
      playAudio("popup_open");
      return originalShow(...args);
    };
  }

  if (typeof popupApi.hide === "function") {
    const originalHide = popupApi.hide.bind(popupApi);
    popupApi.hide = (...args) => {
      playAudio("popup_close");
      return originalHide(...args);
    };
  }
}

withPopupAudio(winPopup);
withPopupAudio(skipPopup);
withPopupAudio(hintPopup);
withPopupAudio(restartPopup);
withPopupAudio(mysteryChestPopup);
withPopupAudio(adSurprisePopup);
withPopupAudio(dailyRankingRewardPopup);


dailyRankingRewardPopup.onClaim(async () => {
  const out = await apiClaimLeaderboardReward();
  if (!out?.ok) {
    dailyRankingRewardPopup.hide();
    return;
  }

  if (out?.user) {
    const targetCoins = Number(out.user.coins ?? CURRENT_USER?.coins ?? 0);
    applyUserPatch(out.user, { skipCoinSync: true });
    await animateCoinsTo(targetCoins, { showGainFx: true });
  }

  dailyRankingRewardPopup.hide();
});

function setupGlobalAudioHooks() {
  setMasterVolume(0.6);

  const s = getSettings();
  const sfxOn = !!s.sound;
  const musicOn = !!(s.music ?? s.sound);
  setSfxEnabled(sfxOn);
  setMusicEnabled(musicOn);

  subscribeSettings((next) => {
    const nextSfxOn = !!next?.sound;
    const nextMusicOn = !!(next?.music ?? next?.sound);

    setSfxEnabled(nextSfxOn);
    setMusicEnabled(nextMusicOn);

    if (nextMusicOn && !document.hidden) {
      startBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }
  });

  let audioUnlocked = false;
  const unlockOnce = () => {
    if (audioUnlocked) return;
    audioUnlocked = true;
    unlockGlobalAudio();
    if (isMusicAllowedNow()) {
      startBackgroundMusic();
    }
  };

  window.addEventListener("pointerdown", unlockOnce, { once: true, passive: true });

  document.addEventListener(
    "pointerdown",
    (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (!t.closest("button, .icon, .startBtn, .accountMiniBtn, [role='button']")) return;
      playAudio("ui_click");
    },
    { passive: true, capture: true }
  );

  document.addEventListener("visibilitychange", () => {
    if (document.hidden || !isMusicAllowedNow()) stopBackgroundMusic();
    else startBackgroundMusic();
  });

  function isMusicAllowedNow() {
    const curr = getSettings();
    return !!(curr.music ?? curr.sound);
  }
}

setupGlobalAudioHooks();


/* -------------------------------
   HINT ARROWS OVERLAY (animated)
-------------------------------- */
const hintStyle = document.createElement("style");
hintStyle.textContent = `
  #hintArrows {
    position: fixed;
    left: 50%;
    top: 52%;
    transform: translate(-50%, -50%);
    z-index: 99999;
    pointer-events: none;
    display: none;
  }
  #hintArrows .stack {
    position: relative;
    width: 64px;
    height: 220px;
    filter: drop-shadow(0 10px 16px rgba(0,0,0,0.35));
  }
  #hintArrows .chev {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 16px solid transparent;
    border-right: 16px solid transparent;
    border-bottom: 22px solid rgba(255,255,255,0.92);
    opacity: 0;
    animation: hintPulse 1.2s linear infinite;
  }
  #hintArrows .chev:nth-child(1) { top: 170px; animation-delay: 0.00s; }
  #hintArrows .chev:nth-child(2) { top: 135px; animation-delay: 0.12s; }
  #hintArrows .chev:nth-child(3) { top: 100px; animation-delay: 0.24s; }
  #hintArrows .chev:nth-child(4) { top: 65px;  animation-delay: 0.36s; }
  #hintArrows .chev:nth-child(5) { top: 30px;  animation-delay: 0.48s; }

  @keyframes hintPulse {
    0%   { opacity: 0; transform: translateX(-50%) translateY(18px) scale(0.96); }
    35%  { opacity: 0.95; }
    70%  { opacity: 0.15; }
    100% { opacity: 0; transform: translateX(-50%) translateY(-18px) scale(1.04); }
  }

  /* rotate the whole stack for direction */
  #hintArrows.dir-up    { transform: translate(-50%, -50%) rotate(0deg); }
  #hintArrows.dir-right { transform: translate(-50%, -50%) rotate(90deg); }
  #hintArrows.dir-down  { transform: translate(-50%, -50%) rotate(180deg); }
  #hintArrows.dir-left  { transform: translate(-50%, -50%) rotate(270deg); }
`;
document.head.appendChild(hintStyle);

const hintArrowsEl = document.createElement("div");
hintArrowsEl.id = "hintArrows";
hintArrowsEl.innerHTML = `
  <div class="stack">
    <div class="chev"></div>
    <div class="chev"></div>
    <div class="chev"></div>
    <div class="chev"></div>
    <div class="chev"></div>
  </div>
`;
document.body.appendChild(hintArrowsEl);
function startRouteHintForLevel(levelNumber) {
  const route = LEVEL_ROUTES?.[levelNumber];

  // reset previous hint state/timers
  hideHintArrows();

  if (!Array.isArray(route) || route.length === 0) {
    return;
  }

  HINT_ACTIVE_FOR_LEVEL = true;
  HINT_ROUTE = route;
  HINT_ROUTE_INDEX = 0;

  // seed last player key to prevent instant auto-advance
  const st = game?.getState?.();
  if (st?.player) {
    HINT_LAST_PLAYER_KEY = `${st.player.x},${st.player.y}`;
  }

  showHintArrows(route[0]);
}

let HINT_LAST_PLAYER_KEY = null;
let HINT_MOVE_LOCK = false;
let HINT_STABLE_TIMER = null;

function advanceRouteStep() {
  if (!HINT_ACTIVE_FOR_LEVEL) return;
  if (!Array.isArray(HINT_ROUTE) || HINT_ROUTE.length === 0) return;

  const nextIndex = Math.min(HINT_ROUTE.length - 1, HINT_ROUTE_INDEX + 1);
  if (nextIndex !== HINT_ROUTE_INDEX) {
    HINT_ROUTE_INDEX = nextIndex;
    const dir = HINT_ROUTE[HINT_ROUTE_INDEX];
    if (dir) showHintArrows(dir);
  }
}
async function apiMe() {
  if (!CURRENT_ACCESS_TOKEN) return null;

  const res = await fetch(`${BACKEND}/api/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
    },
  });

  const serverMs = readServerTimeFromHeaders(res);
  if (Number.isFinite(serverMs)) setGlobalServerTime(serverMs);

  const out = await res.json().catch(() => ({}));

  if (Number.isFinite(serverMs)) {
    out.server_time_ms = serverMs;
    if (out?.user && typeof out.user === "object") {
      out.user.server_time_ms = serverMs;
    }
  }

  return out;
}

mysteryChestPopup.onOpen(async () => {

  const res = await fetch(`${BACKEND}/api/rewards/mystery-chest`, {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      Authorization:`Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`
    }
  });

  const out = await res.json().catch(()=>({}));

  if(!out?.ok) return null;

  const targetCoins = Number(out?.user?.coins ?? CURRENT_USER?.coins ?? 0);
  setTimeout(async () => {
    applyUserPatch(out.user, { skipCoinSync: true });
    await animateCoinsTo(targetCoins, { showGainFx: true });
  }, 3000);

  return out.reward;

});

function formatSurpriseBoxRewardLabel(reward) {
  if (!reward || typeof reward !== "object") return "You got a reward";
  const amount = Math.max(1, Number(reward.rewardAmount ?? 1));
  if (reward.rewardType === "coins") return `You got ${amount} Coins`;
  if (reward.rewardType === "restart") return `You got ${amount} Restart`;
  if (reward.rewardType === "hint") return `You got ${amount} Hint`;
  if (reward.rewardType === "skip") return `You got ${amount} Skip`;
  return "You got a reward";
}

function formatSurpriseBoxRemainingText(remaining) {
  const count = Math.max(0, Number(remaining || 0));
  if (count === 1) return "1 box left today";
  return `${count} boxes left today`;
}

function buildSurpriseBoxUserPatch(out) {
  const dailyBoxesOpened = Number(out?.dailyBoxesOpened ?? out?.user?.daily_surprise_boxes_opened ?? CURRENT_USER?.daily_surprise_boxes_opened ?? 0);
  const dailyBoxesMax = Number(out?.dailyBoxesMax ?? out?.user?.daily_surprise_boxes_max ?? CURRENT_USER?.daily_surprise_boxes_max ?? 4);
  const dailyBoxesRemaining = Number(out?.dailyBoxesRemaining ?? out?.user?.daily_surprise_boxes_remaining ?? Math.max(0, dailyBoxesMax - dailyBoxesOpened));
  return {
    coins: Number(out?.user?.coins ?? CURRENT_USER?.coins ?? 0),
    mc_balance: Number(out?.user?.mc_balance ?? CURRENT_USER?.mc_balance ?? CURRENT_USER?.coins ?? 0),
    restarts_balance: Number(out?.user?.restarts_balance ?? CURRENT_USER?.restarts_balance ?? 0),
    skips_balance: Number(out?.user?.skips_balance ?? CURRENT_USER?.skips_balance ?? 0),
    hints_balance: Number(out?.user?.hints_balance ?? CURRENT_USER?.hints_balance ?? 0),
    daily_surprise_boxes_opened: dailyBoxesOpened,
    daily_surprise_boxes_max: dailyBoxesMax,
    daily_surprise_boxes_remaining: dailyBoxesRemaining,
  };
}

async function startSurpriseBoxFlow({ goNextLevelAfter = false } = {}) {
  if (!CURRENT_ACCESS_TOKEN) {
    ui.showLoginRequired();
    return { ok: false, error: "auth_required" };
  }

  if (!guardAdCooldownBeforeWatching()) {
    return { ok: false, error: "cooldown" };
  }

  if (winAdFlowBusy || isProcessingRewardAd || isOpeningBox || isContinuingSurprise || surpriseBoxRewardResult) {
    showAdCooldownToast("Please wait... preparing surprise box.");
    return { ok: false, error: "busy" };
  }

  winAdFlowBusy = true;
  isProcessingRewardAd = true;
  pendingWinAdNextLevel = Boolean(goNextLevelAfter);
  winPopup.setWatchAdBusy?.(true, "Loading ad...");

  return new Promise((resolve) => {
    simulateAd({
        onFinished: async () => {
          try {
            console.debug("[surprise-box] rewarded ad success callback fired");
            winPopup.setWatchAdBusy?.(true, "Preparing surprise box...");
            const out = await apiOpenSurpriseBox();
            markAdClaimedNow();

            surpriseBoxRewardResult = {
              reward: out?.reward || null,
              label: formatSurpriseBoxRewardLabel(out?.reward),
              userPatch: buildSurpriseBoxUserPatch(out),
            dailyBoxesRemaining: Number(out?.dailyBoxesRemaining ?? 0),
          };
          pendingWinAdBoxReward = surpriseBoxRewardResult;
          console.debug("[surprise-box] reward stored", surpriseBoxRewardResult?.reward?.rewardType || "unknown");
          setPostWinFlow("boxReady");

          if (goNextLevelAfter) {
            winPopup.hide();
          }
          adSurprisePopup.show();
          isProcessingRewardAd = false;
          resolve({ ok: true, out });
        } catch (e) {
          winAdFlowBusy = false;
          isProcessingRewardAd = false;
          pendingWinAdNextLevel = false;
          surpriseBoxRewardResult = null;
          pendingWinAdBoxReward = null;
          winPopup.setWatchAdBusy?.(false);
          setPostWinFlow("win");
          if (e?.surpriseBoxState) {
            applyUserPatch({
              daily_surprise_boxes_opened: Number(e.surpriseBoxState.dailyBoxesOpened ?? CURRENT_USER?.daily_surprise_boxes_opened ?? 0),
              daily_surprise_boxes_max: Number(e.surpriseBoxState.dailyBoxesMax ?? CURRENT_USER?.daily_surprise_boxes_max ?? 4),
              daily_surprise_boxes_remaining: Number(e.surpriseBoxState.dailyBoxesRemaining ?? CURRENT_USER?.daily_surprise_boxes_remaining ?? 0),
            });
          }
          showAdCooldownToast(
            e?.message === "DAILY_SURPRISE_BOX_LIMIT_REACHED"
              ? "Daily limit reached for Surprise Box."
              : "Surprise Box not available. Try again."
          );
          resolve({ ok: false, error: e?.message || "surprise_box_failed" });
        }
      },
    });
  });
}

function canAdvanceToNextLevelNow() {
  const nextLevelNumber = levelIndex + 2;

  if (levelIndex + 1 >= levels.length) {
    return false;
  }

  if (!CURRENT_ACCESS_TOKEN) {
    return nextLevelNumber <= GUEST_MAX_LEVEL;
  }

  const access = refreshLevelsAccessUI();
  return Boolean(access?.canPlayNow && !access?.dailyLimitReached);
}

function getNextLevelActionState() {
  const nextLevelNumber = levelIndex + 2;

  if (levelIndex + 1 >= levels.length) {
    return {
      isPlayable: false,
      helperText: "Open Levels to continue.",
    };
  }

  if (!CURRENT_ACCESS_TOKEN) {
    return nextLevelNumber <= GUEST_MAX_LEVEL
      ? { isPlayable: true, helperText: "" }
      : { isPlayable: false, helperText: "Open Levels to continue." };
  }

  const access = refreshLevelsAccessUI();
  if (access?.dailyLimitReached) {
    return {
      isPlayable: false,
      helperText: "Daily progression complete. Replay unlocked levels from Levels.",
    };
  }

  if (!access?.canPlayNow) {
    return {
      isPlayable: false,
      helperText: "Next level unlocks soon or can be unlocked.",
    };
  }

  return {
    isPlayable: true,
    helperText: "",
  };
}

function syncWinPopupNextLevelState() {
  const nextState = getNextLevelActionState();
  winPopup.setNextLevelEnabled?.(
    nextState.isPlayable,
    nextState.isPlayable ? "Next Level" : "Go to Levels",
    nextState.helperText
  );
}

function resumePostWinFlowAfterSurpriseBox() {
  if (canAdvanceToNextLevelNow()) {
    setPostWinFlow("idle");
    goNextLevel();
    return;
  }

  if (pendingWinPopupState) {
    setPostWinFlow("win");
    winPopup.show(pendingWinPopupState);
    syncWinPopupNextLevelState();
    winPopup.setSurpriseBoxState?.(CURRENT_USER);
  }
}

adSurprisePopup.onOpen(async () => {
  console.debug("[surprise-box] Open Box clicked");
  if (!surpriseBoxRewardResult && !pendingWinAdBoxReward) {
    winAdFlowBusy = false;
    isProcessingRewardAd = false;
    winPopup.setWatchAdBusy?.(false);
    setPostWinFlow("win");
    if (pendingWinPopupState) {
      winPopup.show(pendingWinPopupState);
      syncWinPopupNextLevelState();
      winPopup.setSurpriseBoxState?.(CURRENT_USER);
    }
    return null;
  }

  isOpeningBox = true;
  const rewardPack = surpriseBoxRewardResult || pendingWinAdBoxReward;
  pendingWinAdBoxReward = null;
  const nextCoins = Number(rewardPack?.userPatch?.coins ?? CURRENT_USER?.coins ?? 0);
  const currentCoins = Number(CURRENT_USER?.coins ?? 0);
  applyUserPatch(rewardPack.userPatch, { skipCoinSync: true });
  winPopup.setSurpriseBoxState?.(CURRENT_USER);
  console.debug("[surprise-box] flow changed to boxReward");
  setPostWinFlow("boxReward");
  if (nextCoins !== currentCoins) {
    setTimeout(() => {
      animateCoinsTo(nextCoins, { showGainFx: true }).catch(() => {});
    }, 150);
  }
  isOpeningBox = false;

  return {
    label: rewardPack.label,
    detail: formatSurpriseBoxRemainingText(rewardPack.dailyBoxesRemaining),
    subtitle: formatSurpriseBoxRemainingText(rewardPack.dailyBoxesRemaining),
    confirmText: "Continue",
    ...(rewardPack.reward || {}),
  };
});

adSurprisePopup.onRevealDone(() => {
  console.debug("[surprise-box] Continue clicked");
  winAdFlowBusy = false;
  isProcessingRewardAd = false;
  winPopup.setWatchAdBusy?.(false);
  const shouldContinue = pendingWinAdNextLevel;
  pendingWinAdNextLevel = false;
  surpriseBoxRewardResult = null;
  pendingWinAdBoxReward = null;
  isContinuingSurprise = true;
  if (!shouldContinue) {
    isContinuingSurprise = false;
    setPostWinFlow("win");
    return;
  }
  console.debug("[surprise-box] next level open attempted");
  resumePostWinFlowAfterSurpriseBox();
  isContinuingSurprise = false;
});
function onAnyPaintDuringMove() {
  if (!HINT_ACTIVE_FOR_LEVEL) return;
  if (!Array.isArray(HINT_ROUTE) || HINT_ROUTE.length === 0) return;

  const st = game?.getState?.();
  if (!st?.player) return;

  const key = `${st.player.x},${st.player.y}`;

  // lock is released only after player position stays stable for a short time
  if (key !== HINT_LAST_PLAYER_KEY) {
    HINT_LAST_PLAYER_KEY = key;

    // first paint of a swipe: start lock
    if (!HINT_MOVE_LOCK) {
      HINT_MOVE_LOCK = true;
    }
  }

  clearTimeout(HINT_STABLE_TIMER);
  HINT_STABLE_TIMER = setTimeout(() => {
    HINT_MOVE_LOCK = false;
    advanceRouteStep();
  }, 160);
}


function scheduleHintRecalc() {
  if (!HINT_ACTIVE_FOR_LEVEL) return;
  if (!game?.getState) return;

  if (HINT_RECALC_TIMER) return;
  HINT_RECALC_TIMER = setTimeout(() => {
    HINT_RECALC_TIMER = null;
    if (!game?.getState) return;
    applySmartHintArrows(game);
  }, 80);
}
function showHintArrows(dir /* "up"|"down"|"left"|"right" */) {
  hintArrowsEl.classList.remove("dir-up","dir-down","dir-left","dir-right");
  hintArrowsEl.classList.add(`dir-${dir}`);
  hintArrowsEl.style.display = "block";
  HINT_ACTIVE_FOR_LEVEL = true;
}
function hideHintArrows() {
  hintArrowsEl.style.display = "none";
  HINT_ACTIVE_FOR_LEVEL = false;

  HINT_ROUTE = null;
  HINT_ROUTE_INDEX = 0;

  clearTimeout(HINT_ROUTE_TIMER);
  HINT_ROUTE_TIMER = null;

  clearTimeout(HINT_STABLE_TIMER);
  HINT_STABLE_TIMER = null;

  HINT_LAST_PLAYER_KEY = null;
  HINT_MOVE_LOCK = false;
}
/* -------------------------------
   SMART NEXT MOVE (best immediate)
-------------------------------- */
function _slideTargetAndNewPaintCount(state, dx, dy) {
  const sx = state.player.x;
  const sy = state.player.y;

  let x = sx;
  let y = sy;
  let newPaint = 0;

  while (true) {
    const nx = x + dx;
    const ny = y + dy;
    if (!state.isWalkable(nx, ny)) break;
    x = nx;
    y = ny;
    const k = `${x},${y}`;
    if (!state.painted.has(k)) newPaint++;
  }

  const dist = Math.abs(x - sx) + Math.abs(y - sy);
  return { dist, newPaint };
}

function getBestDirection(state) {
  const options = [
    { dir: "up", dx: 0, dy: -1 },
    { dir: "down", dx: 0, dy: 1 },
    { dir: "left", dx: -1, dy: 0 },
    { dir: "right", dx: 1, dy: 0 },
  ].map((d) => {
    const out = _slideTargetAndNewPaintCount(state, d.dx, d.dy);
    return { ...d, ...out };
  }).filter(o => o.dist > 0);

  if (!options.length) return null;

  options.sort((a, b) => {
    if (b.newPaint !== a.newPaint) return b.newPaint - a.newPaint;
    return b.dist - a.dist;
  });

  return options[0].dir;
}

function applySmartHintArrows(game) {
  const state = game?.getState?.();
  if (!state) return;
  const dir = getBestDirection(state);
  if (!dir) return;
  showHintArrows(dir);
}
// simple hint overlay (text)
const hintTextEl = document.createElement("div");
hintTextEl.id = "hintTextOverlay";
hintTextEl.style.cssText = `
  position: fixed;
  left: 50%;
  bottom: 110px;
  transform: translateX(-50%);
  max-width: min(92vw, 520px);
  background: rgba(0,0,0,0.82);
  color: #fff;
  padding: 12px 14px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.35;
  z-index: 99999;
  display: none;
`;
document.body.appendChild(hintTextEl);

let hintTextTimer = null;
function showHintText(msg) {
  if (!msg) return;
  hintTextEl.textContent = String(msg);
  hintTextEl.style.display = "block";
  clearTimeout(hintTextTimer);
  hintTextTimer = setTimeout(() => {
    hintTextEl.style.display = "none";
  }, 4500);
}

function _slideTargetAndNewPaintCount(state, dx, dy) {
  const sx = state.player.x;
  const sy = state.player.y;

  let x = sx;
  let y = sy;

  let newPaint = 0;

  // move until wall, counting unpainted walkable tiles passed through
  while (true) {
    const nx = x + dx;
    const ny = y + dy;
    if (!state.isWalkable(nx, ny)) break;

    x = nx;
    y = ny;

    const k = `${x},${y}`;
    if (!state.painted.has(k)) newPaint++;
  }

  const dist = Math.abs(x - sx) + Math.abs(y - sy);
  return { tx: x, ty: y, dist, newPaint };
}

function getSmartHintFromState(state) {
  if (!state) return null;

  const dirs = [
    { name: "UP", dx: 0, dy: -1, arrow: "?" },
    { name: "DOWN", dx: 0, dy: 1, arrow: "?" },
    { name: "LEFT", dx: -1, dy: 0, arrow: "?" },
    { name: "RIGHT", dx: 1, dy: 0, arrow: "?" },
  ];

  const options = [];

  for (const d of dirs) {
    const out = _slideTargetAndNewPaintCount(state, d.dx, d.dy);

    // ignore �no movement�
    if (out.dist <= 0) continue;

    options.push({
      ...d,
      ...out,
    });
  }

  if (options.length === 0) return null;

  // Prefer: paints the most new tiles
  // Tie-break: longer slide distance (usually better reposition)
  options.sort((a, b) => {
    if (b.newPaint !== a.newPaint) return b.newPaint - a.newPaint;
    return b.dist - a.dist;
  });

  return options[0];
}

function showSmartHint(game) {
  const state = game?.getState?.();
  const best = getSmartHintFromState(state);

  if (!best) {
    showHintText("No hint available.");
    return;
  }

  // short, actionable hint
  showHintText(`Swipe ${best.name} ${best.arrow}`);
}



  function setLevel(i) {
    levelIndex = Math.max(0, Math.min(levels.length - 1, i));
    ui.setLevel(levelIndex + 1);
    game.setLevel(levels[levelIndex]);
  }

  function goNextLevel() {
    setLevel(levelIndex + 1);
  }

  // (level-complete reward is handled via global apiClaimLevelComplete)


levelsUI = mountLevelsUI(root, { totalLevels: levels.length });  
ui.levelsBtn.addEventListener("click", () => {
  // keep levels UI in sync before opening
if (CURRENT_ACCESS_TOKEN) {
  // logged-in: NEVER apply guest cap
  levelsUI.setUnlocked?.(CURRENT_MAX_UNLOCKED_LEVEL || 1);
  refreshLevelsAccessUI();
} else {
  const guestProgress = loadGuestProgress();
  const unlocked = Math.min(guestProgress.maxLevel || 1, GUEST_MAX_LEVEL);
  CURRENT_MAX_UNLOCKED_LEVEL = unlocked;
  levelsUI.setUnlocked?.(unlocked);
  levelsUI.setLevelAccess?.({
    dailyLevelsPlayed: 0,
    dailyLevelsUnlocked: LEVEL_ACCESS_DEFAULTS.dailyLevelsMax,
    dailyLevelsMax: LEVEL_ACCESS_DEFAULTS.dailyLevelsMax,
    initialDailyUnlockedLevels: LEVEL_ACCESS_DEFAULTS.dailyLevelsMax,
    unlockIntervalSeconds: LEVEL_ACCESS_DEFAULTS.unlockIntervalSeconds,
    unlockLevelsPerInterval: LEVEL_ACCESS_DEFAULTS.unlockLevelsPerInterval,
    adUnlockLevels: LEVEL_ACCESS_DEFAULTS.adUnlockLevels,
    nextUnlockAt: null,
    canWatchAdToUnlock: false,
    canPlayNow: true,
    dailyLimitReached: false,
  });
}

  levelsUI.open();
});

// Level select
levelsUI.onSelect((levelNumber) => {
  // Guest can only open levels 1..GUEST_MAX_LEVEL
  if (!CURRENT_ACCESS_TOKEN && levelNumber > GUEST_MAX_LEVEL) {
    ui.showLoginRequired();
    return false;
  }

  if (CURRENT_ACCESS_TOKEN) {
    const isReplaySelection = isReplayLevelNumber(levelNumber);
    const access = refreshLevelsAccessUI();
    if (!isReplaySelection && access.dailyLimitReached) {
      alert("Daily limit reached. Come back tomorrow for more levels.");
      return false;
    }
    if (!isReplaySelection && !access.canPlayNow) {
      if (access.canWatchAdToUnlock) {
        const adUnlockLevels = Math.max(1, Number(access.adUnlockLevels || LEVEL_ACCESS_DEFAULTS.adUnlockLevels));
        alert(`You've used your current unlocked levels. Watch an ad to unlock ${adUnlockLevels} ${adUnlockLevels === 1 ? "level" : "levels"} now or wait for the timer.`);
      } else {
        alert("More levels unlock over time. Check the timer in the Levels screen.");
      }
      return false;
    }
  }

  goToLevel(levelNumber - 1);
  return true;
});

levelsUI.onUnlockNow(async () => {
  if (!CURRENT_ACCESS_TOKEN) {
    ui.showLoginRequired();
    return;
  }

  try {
    simulateAd({
      onFinished: async () => {
        try {
          const out = await apiUnlockLevelsByAd();
          if (out?.user) {
            applyUserPatch({
              ...out.user,
              ...(out.levelAccess || {}),
            });
          } else if (out?.levelAccess) {
            applyUserPatch(out.levelAccess);
          }
          refreshLevelsAccessUI();
          const adUnlockLevels = Math.max(1, Number(out?.levelAccess?.adUnlockLevels ?? CURRENT_USER?.adUnlockLevels ?? LEVEL_ACCESS_DEFAULTS.adUnlockLevels));
          alert(`${adUnlockLevels} more ${adUnlockLevels === 1 ? "level" : "levels"} unlocked.`);
        } catch (e) {
          if (e?.levelAccess) {
            applyUserPatch(e.levelAccess);
          }
          alert(e?.message || "Unlock failed");
        }
      },
      duration: 20,
      skipAfter: 5,
      buttonLabel: "Close Ad",
    });
  } catch (e) {
    alert(e?.message || "Unlock failed");
  }
});
  if (CURRENT_ACCESS_TOKEN) {
  document.body.classList.remove("welcome-visible");
} else {
  document.body.classList.add("welcome-visible");
  ui.showWelcome();
}
  if (!CURRENT_ACCESS_TOKEN) {
  // if guest is already running and on level 1, run tutorial hint once
  maybeAutoHintTutorial();
}

// Create game (DO NOT START)
  game = createGame({
    canvas: ui.canvas,
    level: levels[0],
    getCurrentUser: () => CURRENT_USER ?? { username: "guest", uid: null },

    onTilePainted({ key, x, y }) {
      if (HINT_ACTIVE_FOR_LEVEL) {
        onAnyPaintDuringMove();
      }
      // resume save is logged-in only
      if (!CURRENT_ACCESS_TOKEN) return;
      if (!RESUME_ENABLED) return;

      RESUME_TILES.add(key);
      RESUME_POS = { x, y };

      scheduleResumeSave(levelIndex + 1);
    },

    async onLevelComplete({ level }) {
      hideHintArrows();
      HINT_ROUTE = null;
      HINT_ROUTE_INDEX = 0;
      HINT_ACTIVE_FOR_LEVEL = false;
      RESUME_ENABLED = false;

      const completedLevel = level?.number ?? (levelIndex + 1);
      const autoAdDueNow = completedLevel > 2 && !AD_OVERLAY_ACTIVE && shouldShowAutoAd();
      let winPopupState = buildLevelCompletePopupState(null, completedLevel);
      let rewardAccepted = true;

      // Do reward sync in parallel so leaderboard timing stays fixed.
      const rewardSyncPromise = CURRENT_ACCESS_TOKEN && !CURRENT_LEVEL_IS_REPLAY
        ? (async () => {
            try {
              const out = await apiClaimLevelComplete(completedLevel);

                if (out?.ok !== false && out) {
                  if (completedLevel > 0) {
                    CURRENT_COMPLETED_LEVELS.add(completedLevel);
                  }
                  winPopupState = buildLevelCompletePopupState(out, completedLevel);
                  winPopup.setRewardSummary?.(winPopupState);
                }

              if (out?.user) {
                applyUserPatch({
                  ...out.user,
                  ...(out.levelAccess || {}),
                }, { skipCoinSync: true, skipScoreSync: true });
                await Promise.all([
                  animateCoinsTo(Number(out.user.coins ?? 0), { showGainFx: true }),
                  animateScoreTo(Number(out.user.score ?? out.user.rp_score ?? 0), { showGainFx: true }),
                ]);
              } else if (out?.levelAccess) {
                applyUserPatch(out.levelAccess);
              }

              if (out?.ok === false && out?.error) {
                rewardAccepted = false;
                if (out?.levelAccess) {
                  applyUserPatch(out.levelAccess);
                }
                alert(
                  out.error === "daily_level_limit_reached"
                    ? "Daily limit reached. Come back tomorrow for more levels."
                    : out.error === "daily_levels_locked"
                      ? `You've used your current unlocked levels. Wait for the timer or unlock ${Math.max(1, Number(out?.levelAccess?.adUnlockLevels ?? CURRENT_USER?.adUnlockLevels ?? LEVEL_ACCESS_DEFAULTS.adUnlockLevels))} ${Math.max(1, Number(out?.levelAccess?.adUnlockLevels ?? CURRENT_USER?.adUnlockLevels ?? LEVEL_ACCESS_DEFAULTS.adUnlockLevels)) === 1 ? "level" : "levels"} with an ad.`
                      : out.error
                );
              }
            } catch {}
          })()
        : Promise.resolve();

      // Fixed timing: reward animation stays visible for ~2 seconds from level complete.
      await sleep(2000);

      afterLevelCompleteShowAdOrWin(winPopupState);

      // Keep reward flow completion non-blocking for popup timing.
      await rewardSyncPromise;

      // logged-in: unlock next level + persist progress and clear resume
      if (CURRENT_ACCESS_TOKEN && rewardAccepted && !CURRENT_LEVEL_IS_REPLAY) {
        const nextUnlocked = Math.min(levels.length, completedLevel + 1);

        CURRENT_MAX_UNLOCKED_LEVEL = Math.max(
          CURRENT_MAX_UNLOCKED_LEVEL,
          nextUnlocked
        );

        setTimeout(() => levelsUI.setUnlocked?.(CURRENT_MAX_UNLOCKED_LEVEL), 0);

        apiSetProgress({
          uid: CURRENT_USER.uid,
          level: nextUnlocked,
          paintedKeys: [],
          resume: null,
        }).catch(() => {});
      }

      // guest progress is local-only (levels 1..GUEST_MAX_LEVEL)
      if (!CURRENT_ACCESS_TOKEN) {
        const nextUnlock = Math.min(GUEST_MAX_LEVEL, completedLevel + 1);
        const current = loadGuestProgress();
        const newMax = Math.min(
          GUEST_MAX_LEVEL,
          Math.max(current?.maxLevel || 1, nextUnlock)
        );
        saveGuestProgress(newMax);
        CURRENT_MAX_UNLOCKED_LEVEL = newMax;
        setTimeout(() => levelsUI.setUnlocked?.(newMax), 0);
      }
    },
  });
function maybeAutoHintTutorial() {
  // no-op; tutorial is started directly inside ui.onGuestStart
}
function wipeResumeForCurrentLevel() {
  if (!CURRENT_ACCESS_TOKEN) return;

  RESUME_TILES = new Set();
  RESUME_POS = null;

  apiSetProgress({
    uid: CURRENT_USER.uid,
    level: CURRENT_MAX_UNLOCKED_LEVEL,
    paintedKeys: [],
    resume: null,
  }).catch(() => {});
}

function isReplayLevelNumber(levelNumber) {
  const numericLevel = Number(levelNumber || 0);
  if (CURRENT_COMPLETED_LEVELS.has(numericLevel)) {
    return true;
  }
  const maxUnlocked = Number(CURRENT_MAX_UNLOCKED_LEVEL || 1);
  return numericLevel > 0 && numericLevel < maxUnlocked;
}

function restartLevelForHint() {
  hideHintArrows();

  // clear saved in-level progress for logged-in users
  if (CURRENT_ACCESS_TOKEN) {
    wipeResumeForCurrentLevel();
  }


  // reset route-hint state so arrows start from step 1
  HINT_ROUTE = null;
  HINT_ROUTE_INDEX = 0;
  HINT_ACTIVE_FOR_LEVEL = false;
    // restart current level locally without consuming restart resource
  game.setLevel(levels[levelIndex]);

}
function goToLevel(nextIndex) {
    hideHintArrows();
HINT_ROUTE = null;
HINT_ROUTE_INDEX = 0;
HINT_ACTIVE_FOR_LEVEL = false;
RESUME_ENABLED = false;
  levelIndex = Math.max(0, Math.min(levels.length - 1, nextIndex));
  const lvl = levels[levelIndex];

  const selectedLevelNumber = levelIndex + 1;
  CURRENT_LEVEL_IS_REPLAY = isReplayLevelNumber(selectedLevelNumber);

  game.setLevel(lvl);
// ? Capture spawn tile AFTER level fully loads
setTimeout(() => {
  const p = game.getPlayer?.();
  if (p) {
    LEVEL_START_KEY = `${p.x},${p.y}`;
    console.log("LEVEL_START_KEY =", LEVEL_START_KEY);
  }
}, 50);
  ui.setLevel(selectedLevelNumber);

  // Only logged-in users can resume
  if (!CURRENT_ACCESS_TOKEN) return;

  RESUME_ENABLED = true;

  // Fetch latest progress from backend memory (already loaded in CURRENT_MAX_UNLOCKED_LEVEL flow)
  fetch(`${BACKEND}/api/me`, {
    headers: {
      Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
    },
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((me) => {
      const progress = me?.progress;
      if (!progress) return;

      // Only resume if this level matches saved level
      if (progress.level !== selectedLevelNumber) return;

      const paintedKeys = progress.paintedKeys;
      const resume = progress.resume;

      if (Array.isArray(paintedKeys) || resume) {
        RESUME_TILES = new Set(Array.isArray(paintedKeys) ? paintedKeys : []);
        RESUME_POS = resume ?? null;

        game.applyProgress({
          paintedKeys: Array.from(RESUME_TILES),
          player: RESUME_POS,
        });
      }
    })
    .catch(() => {});
}
function simulateInterstitialAd(onFinished) {
  simulateAd({
    onFinished,
    duration: 20,
    skipAfter: 5,
    buttonLabel: "Skip Ad",
    rewardReadyText: "? Ad Finished",
  });
}
function afterLevelCompleteShowAdOrWin({ levelNumber, rewards = null, rewardStatus = "", rewardNote = "" }) {
  pendingWinPopupState = { levelNumber, rewards, rewardStatus, rewardNote };
  setPostWinFlow("win");
  surpriseBoxRewardResult = null;
  pendingWinAdBoxReward = null;
  isProcessingRewardAd = false;
  isOpeningBox = false;
  isContinuingSurprise = false;

  // Optional: do not show auto ads on the first few levels
  if (levelNumber <= 2) {
    winPopup.show(pendingWinPopupState);
    syncWinPopupNextLevelState();
    winPopup.setSurpriseBoxState?.(CURRENT_USER);
    return;
  }

  // never stack a second ad on top of an existing one
  if (AD_OVERLAY_ACTIVE) {
    return;
  }

  if (shouldShowAutoAd()) {
    markAutoAdShown();

    simulateInterstitialAd(() => {
      winPopup.show(pendingWinPopupState);
      syncWinPopupNextLevelState();
      winPopup.setSurpriseBoxState?.(CURRENT_USER);
    });
  } else {
    winPopup.show(pendingWinPopupState);
    syncWinPopupNextLevelState();
    winPopup.setSurpriseBoxState?.(CURRENT_USER);
  }
}
function simulateAd({
  onFinished,
  duration = 10,
  skipAfter = 10,
  buttonLabel = "Close",
} = {}) {
  if (AD_OVERLAY_ACTIVE) return;
  AD_OVERLAY_ACTIVE = true;
  document.body.classList.add("ad-playing");

  let seconds = duration;
  let skipUnlock = skipAfter;
  let finished = false;
  let settled = false;

  const overlay = document.createElement("div");
  overlay.className = "ad-overlay";

  overlay.innerHTML = `
    <div class="ad-box">
      <div class="ad-video">
        ?? Sponsored Ad
      </div>

      <div id="adCountdown">
        Ad ends in <b>${seconds}</b>s
      </div>

      <div class="ad-progress-container">
        <div id="adBar" class="ad-progress-bar"></div>
      </div>

      <button id="closeAdBtn" class="ad-close-btn" disabled>
        ${skipUnlock > 0 ? `${buttonLabel} in ${skipUnlock}s` : buttonLabel}
      </button>
    </div>
  `;

  document.body.appendChild(overlay);
  

  const countdownEl = overlay.querySelector("#adCountdown");
  const bar = overlay.querySelector("#adBar");
  const closeBtn = overlay.querySelector("#closeAdBtn");

  const total = duration;

  function finishAd() {
    if (settled) return;
    settled = true;
    clearInterval(interval);

    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }

    AD_OVERLAY_ACTIVE = false;
    document.body.classList.remove("ad-playing");
    onFinished?.();
  }

  const interval = setInterval(() => {
    seconds -= 1;
    if (skipUnlock > 0) skipUnlock -= 1;

    countdownEl.innerHTML = `Ad ends in <b>${seconds}</b>s`;
    bar.style.width = `${((total - seconds) / total) * 100}%`;

    if (skipUnlock > 0) {
      closeBtn.textContent = `${buttonLabel} in ${skipUnlock}s`;
      closeBtn.disabled = true;
      closeBtn.classList.remove("enabled");
    } else {
      closeBtn.textContent = buttonLabel;
      closeBtn.disabled = false;
      closeBtn.classList.add("enabled");
    }

    if (seconds <= 0) {
      finished = true;
      closeBtn.textContent = "Close";
      closeBtn.disabled = false;
      closeBtn.classList.add("enabled");
      setTimeout(() => {
        finishAd();
      }, 200);
    }
  }, 1000);

closeBtn.addEventListener("click", () => {
  if (!finished && skipUnlock > 0) return;
  finishAd();
});
}
async function grantRestartAdReward() {
  const out = await fetch(`${BACKEND}/api/restart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
    },
    body: JSON.stringify({
      mode: "ad",
      nonce: crypto.randomUUID(),
    }),
  }).then((r) => r.json());

  if (!out?.ok) return alert(out.error || "Restart failed");

  applyUserPatch({
    free_restarts_used: out.free_restarts_used,
    restarts_balance: out.restarts_balance,
  });

  updateAllBadges();
  wipeResumeForCurrentLevel();
  game.setLevel(levels[levelIndex]);
}

function goNextLevel() {
  goToLevel(levelIndex + 1);
}
function openLevelsOverlayFromWin() {
  winPopup.hide();
  levelsUI?.open?.();
}
winPopup.onNextLevel(() => {
  const nextLevelNumber = levelIndex + 2; // levelIndex is 0-based
  const hasNextLevel = nextLevelNumber <= levels.length;

  // Guest limit: require login after level 5
  if (!CURRENT_ACCESS_TOKEN && nextLevelNumber > GUEST_MAX_LEVEL) {
    winPopup.hide();
    ui.showLoginRequired();
    return;
  }

  if (!hasNextLevel) {
    openLevelsOverlayFromWin();
    return;
  }

  if (CURRENT_ACCESS_TOKEN) {
    const access = refreshLevelsAccessUI();
    if (!access?.canPlayNow || access?.dailyLimitReached) {
      openLevelsOverlayFromWin();
      return;
    }
  }

  winPopup.hide();
  goNextLevel();
});
winPopup.onWatchAdClick(() => {
  startSurpriseBoxFlow({ goNextLevelAfter: true });
});


// ---- SKIP / HINT buttons (backend-powered) ----
ui.onSkipClick(async () => {
  if (!CURRENT_ACCESS_TOKEN) {
    ui.showLoginRequired();
    return;
  }

  try {
    const out = await apiSkip({ mode: "auto" });

    applyUserPatch({
  free_skips_used: out.free_skips_used,
  skips_balance: out.skips_balance,
  coins: out.coins,
});

    updateAllBadges();
    goNextLevel();
    return;

  } catch (e) {
    if (e.message === "No skips available") {
      skipPopup.open({
        coins: CURRENT_USER?.coins ?? 0,
        freeLeft: 0,
      });
      return;
    }

    console.error("Skip error:", e);
  }
});


skipPopup.onBuySkip(async () => {
  try {
    const out = await apiSkip({ mode: "coins" });

    applyUserPatch({
  free_skips_used: out.free_skips_used,
  skips_balance: out.skips_balance,
  coins: out.coins,
});

    updateAllBadges();
    skipPopup.hide();
    goNextLevel();

  } catch (e) {
    alert(e.message || "Skip failed");
  }
});


skipPopup.onWatchAdSkip(() => {
  if (!guardAdCooldownBeforeWatching()) {
    return;
  }

  simulateAd({
    onFinished: async () => {
      const out = await apiSkip({
        mode: "ad",
        nonce: crypto.randomUUID(),
      });

      if (!out?.ok) {
        showAdCooldownToast(out.error || "Skip failed");
        return;
      }

      markAdClaimedNow();

      applyUserPatch({
        free_skips_used: out.free_skips_used,
        skips_balance: out.skips_balance,
      });

      updateAllBadges();
      skipPopup.hide();
      goNextLevel();
    },
  });
});
ui.onHintClick(async () => {
  if (!CURRENT_ACCESS_TOKEN) {
    ui.showLoginRequired();
    return;
  }

  try {
    const out = await apiHint({ mode: "auto" });

    applyUserPatch({
      free_hints_used: out.free_hints_used,
      hints_balance: out.hints_balance,
      coins: out.coins,
    });

    updateAllBadges();

    restartLevelForHint();
    startRouteHintForLevel(levelIndex + 1);

    return;
  } catch (e) {
    if (e.message === "No hints available") {
      hintPopup.open({
        coins: CURRENT_USER?.coins ?? 0,
        freeLeft: 0,
      });
      return;
    }

    console.error("Hint error:", e);
  }
});

hintPopup.onBuyHint(async () => {
  try {
    const out = await apiHint({ mode: "coins" });

    applyUserPatch({
      free_hints_used: out.free_hints_used,
      hints_balance: out.hints_balance,
      coins: out.coins,
    });

    updateAllBadges();
    hintPopup.hide();

    restartLevelForHint();
    startRouteHintForLevel(levelIndex + 1);
  } catch (e) {
    alert(e.message || "Hint failed");
  }
});

hintPopup.onWatchAdHint(() => {
  if (!guardAdCooldownBeforeWatching()) {
    return;
  }

  simulateAd({
    onFinished: async () => {
      const out = await apiHint({
        mode: "ad",
        nonce: crypto.randomUUID(),
      });

      if (!out?.ok) {
        showAdCooldownToast(out.error || "Hint failed");
        return;
      }

      markAdClaimedNow();

      applyUserPatch({
        free_hints_used: out.free_hints_used,
        hints_balance: out.hints_balance,
      });

      updateAllBadges();
      hintPopup.hide();

      restartLevelForHint();
      startRouteHintForLevel(levelIndex + 1);
    },
  });
});

ui.onRestartClick(async () => {
  if (!CURRENT_ACCESS_TOKEN) {
    ui.showLoginRequired();
    return;
  }

  try {
    const out = await fetch(`${BACKEND}/api/restart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
      },
      body: JSON.stringify({
        mode: "auto",
        nonce: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      }),
    }).then((r) => r.json());

    if (!out?.ok) throw new Error(out?.error);

    applyUserPatch({
      free_restarts_used: out.free_restarts_used,
      restarts_balance: out.restarts_balance,
      coins: out.coins,
    });

    updateAllBadges();
    wipeResumeForCurrentLevel();
    game.setLevel(levels[levelIndex]);
    return;

  } catch (e) {
    if (e.message === "No restarts available") {
      restartPopup.open({
        coins: CURRENT_USER?.coins ?? 0,
        freeLeft: 0,
      });
      return;
    }

    console.error("Restart error:", e);
  }
});


restartPopup.onBuyRestart(async () => {
  try {
    const out = await fetch(`${BACKEND}/api/restart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
      },
      body: JSON.stringify({
        mode: "coins",
        nonce: crypto.randomUUID(),
      }),
    }).then((r) => r.json());

    if (!out?.ok) throw new Error(out?.error);

    applyUserPatch({
  free_restarts_used: out.free_restarts_used,
  restarts_balance: out.restarts_balance,
  coins: out.coins,
});

    updateAllBadges();
    wipeResumeForCurrentLevel();
    game.setLevel(levels[levelIndex]);
    restartPopup.hide();

  } catch (e) {
    alert(e.message || "Restart failed");
  }
});


restartPopup.onWatchAdRestart(() => {
  if (!guardAdCooldownBeforeWatching()) {
    return;
  }

  simulateAd({
    onFinished: async () => {
      const out = await fetch(`${BACKEND}/api/restart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${normalizeToken(CURRENT_ACCESS_TOKEN)}`,
        },
        body: JSON.stringify({
          mode: "ad",
          nonce: crypto.randomUUID(),
        }),
      }).then(r => r.json());

      if (!out?.ok) {
        showAdCooldownToast(out.error || "Restart failed");
        return;
      }

      markAdClaimedNow();

      applyUserPatch({
        free_restarts_used: out.free_restarts_used,
        restarts_balance: out.restarts_balance,
        coins: out.coins,
      });

      updateAllBadges();
      wipeResumeForCurrentLevel();
      game.setLevel(levels[levelIndex]);
      restartPopup.hide();
    },
  });
});
  // ---- GUEST ----
ui.onGuestStart(() => {
  CURRENT_USER = { username: "Guest", uid: null, coins: 0, score: 0, dailyRp: 0 };
  CURRENT_ACCESS_TOKEN = null;
  CURRENT_COMPLETED_LEVELS = new Set();

  CURRENT_MAX_UNLOCKED_LEVEL = 1;

  setLevel(0);

  ui.setUser({
    ...CURRENT_USER,
    level: 1,
  });

  document.body.classList.add("game-running");
  ui.hideWelcome();

  if (!game.isRunning?.()) {
    game.start();
  }

  updateAllBadges();

// tutorial hint: always show for guest on level 1
  setTimeout(() => {
    if ((levelIndex + 1) !== 1) return;

    startRouteHintForLevel(1);
  }, 600);
});
// ---- PI LOGIN ----

ui.onLoginClick(async (e) => {
  // fix "first tap does nothing" + prevent double taps
  e?.preventDefault?.();
  e?.stopPropagation?.();
  if (LOGIN_IN_PROGRESS) return;
  LOGIN_IN_PROGRESS = true;

  showLoginLoading();

  try {
    const result = await ensurePiLogin({
      BACKEND,
      ui,
      onLogin: ({ accessToken }) => {
        CURRENT_ACCESS_TOKEN = normalizeToken(accessToken);
        localStorage.setItem("pi_access_token", CURRENT_ACCESS_TOKEN);
      },
    });

    if (!CURRENT_ACCESS_TOKEN && result?.accessToken) {
      CURRENT_ACCESS_TOKEN = normalizeToken(result.accessToken);
    }

    if (!CURRENT_ACCESS_TOKEN) {
      hideLoginLoading();
      LOGIN_IN_PROGRESS = false;
      document.body.classList.remove("game-running");
      document.body.classList.add("welcome-visible");
      ui.showWelcome();
      return;
    }

    const me = await loadMeAndSyncUI({
      BACKEND,
      token: CURRENT_ACCESS_TOKEN,
      ui,
    });

    if (!me?.user) {
      hideLoginLoading();
      LOGIN_IN_PROGRESS = false;
      CURRENT_ACCESS_TOKEN = null;
      CURRENT_USER = null;
      CURRENT_COMPLETED_LEVELS = new Set();
      localStorage.removeItem("pi_access_token");
      document.body.classList.remove("game-running");
      document.body.classList.add("welcome-visible");
      ui.showWelcome();
      return;
    }

    await tryAutoClaimInvite();

    const unlockedLevel =
      me?.progress?.level ??
      me?.progress?.maxLevel ??
      me?.progress?.highestLevel ??
      1;

    const UNLOCKED_LEVEL = Math.max(1, Number(unlockedLevel) || 1);

    window.__maze.guestMaxLevel = Infinity;

    CURRENT_MAX_UNLOCKED_LEVEL = UNLOCKED_LEVEL;
    levelsUI.setUnlocked?.(UNLOCKED_LEVEL);

    ui.setUser({
      ...CURRENT_USER,
      level: CURRENT_MAX_UNLOCKED_LEVEL,
    });

    setLevel(Math.max(0, UNLOCKED_LEVEL - 1));

    RESUME_ENABLED = true;
    RESUME_TILES = new Set();
    RESUME_POS = null;

    const paintedKeys = me?.progress?.paintedKeys;
    const resume = me?.progress?.resume;

    if (Array.isArray(paintedKeys)) {
      for (const k of paintedKeys) RESUME_TILES.add(k);
    }
    if (resume && resume.x != null && resume.y != null) {
      RESUME_POS = { x: resume.x, y: resume.y };
    }

    document.body.classList.add("game-running");

    if (!game.isRunning?.()) game.start();

    ui.hideWelcome();
    document.body.classList.remove("welcome-visible");

    hideLoginLoading();
    updateAllBadges();
    LOGIN_IN_PROGRESS = false;
    
setTimeout(() => {
  void maybeShowDailyRankingRewardPopup();
}, 1200);

    if (RESUME_TILES.size > 0 || RESUME_POS) {
      setTimeout(() => {
        game.applyProgress({
          paintedKeys: Array.from(RESUME_TILES),
          player: RESUME_POS,
        });
      }, 0);
    }
  } catch (e) {
    hideLoginLoading();
    LOGIN_IN_PROGRESS = false;
    document.body.classList.remove("game-running");
    document.body.classList.add("welcome-visible");
    ui.showWelcome();
  }
});
}

boot();























