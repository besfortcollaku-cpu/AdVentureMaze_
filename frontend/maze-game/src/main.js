// src/main.js
import "./style.css";

import { mountUI } from "./ui/ui.js";
import { enforcePiEnvironment } from "./pi/piDetect.js";
import { initPi } from "./pi/piInit.js";
import { ensurePiLogin } from "./pi/piClient.js";

import { createGame } from "./game/game.js";
import { levels } from "./levels/index.js";

import { getSettings, setSetting, subscribeSettings } from "./settings.js";
import { ensureAudioUnlocked, stopRollSound } from "./game/rollSound.js";

const BACKEND = "https://adventuremaze.onrender.com";

let CURRENT_USER = { username: "guest", uid: null };
let CURRENT_ACCESS_TOKEN = null;

let levelIndex = 0;
let game = null;
let ui = null;

// local cache synced from /api/me
let COINS = 0;

// prevent double reward per completion
let rewardedThisLevel = false;

// ---------------------------
// Backend helpers
// ---------------------------
function authHeaders() {
  if (!CURRENT_ACCESS_TOKEN) throw new Error("Missing access token. Please login again.");
  return {
    Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}`,
  };
}

function uuid() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

async function apiGetMe() {
  const res = await fetch(`${BACKEND}/api/me`, { headers: { ...authHeaders() } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) throw new Error(data?.error || "api/me failed");
  return data;
}

async function apiSetProgress({ uid, level, coins }) {
  const res = await fetch(`${BACKEND}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ uid, level, coins }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) throw new Error(data?.error || "progress save failed");
  return data;
}

async function apiClaimLevelComplete(levelNumber) {
  const res = await fetch(`${BACKEND}/api/rewards/level-complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ level: levelNumber }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) throw new Error(data?.error || "level-complete failed");
  return data; // { ok, already, user }
}

async function apiAd50() {
  const res = await fetch(`${BACKEND}/api/rewards/ad-50`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ nonce: `ad50:${CURRENT_USER.uid}:${uuid()}` }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) throw new Error(data?.error || "ad-50 failed");
  return data; // { ok, already, user }
}

async function apiSkip() {
  const res = await fetch(`${BACKEND}/api/skip`, { method: "POST", headers: { ...authHeaders() } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) throw new Error(data?.error || "skip failed");
  return data; // { ok, mode, freeLeft, user }
}

async function apiHint() {
  const res = await fetch(`${BACKEND}/api/hint`, { method: "POST", headers: { ...authHeaders() } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) throw new Error(data?.error || "hint failed");
  return data; // { ok, mode, freeLeft, user }
}

function clampLevelIndex(i) {
  if (i < 0) return 0;
  if (i >= levels.length) return 0;
  return i;
}

// ---------------------------
// Boot
// ---------------------------
async function boot() {
  ui = mountUI(document.querySelector("#app"));

  // unlock audio after first gesture
  ui.onFirstUserGesture(() => ensureAudioUnlocked());

  // settings
  const s0 = getSettings();
  ui.setSoundEnabled(s0.sound);
  ui.setVibrationEnabled(s0.vibration);

  ui.onSoundToggle((v) => {
    setSetting("sound", v);
    if (!v) stopRollSound();
  });
  ui.onVibrationToggle((v) => setSetting("vibration", v));

  subscribeSettings((s) => {
    ui.setSoundEnabled(s.sound);
    ui.setVibrationEnabled(s.vibration);
    if (!s.sound) stopRollSound();
  });

  // Pi environment
  const env = await enforcePiEnvironment({
    desktopBlockEl: document.getElementById("desktopBlock"),
  });
  if (!env.ok) return;

  // init Pi SDK
  initPi();

  // login
  const loginRes = await ensurePiLogin({
    BACKEND,
    ui,
    onLogin: ({ user, accessToken }) => {
      CURRENT_USER = user;
      CURRENT_ACCESS_TOKEN = accessToken;

      if (ui?.userPill) ui.userPill.textContent = `User: ${user.username}`;
      if (ui?.loginBtnText) ui.loginBtnText.textContent = "Logged in ✅";
    },
  });

  if (!loginRes?.ok) return;

  // load server state
  let me;
  try {
    me = await apiGetMe();
  } catch (e) {
    alert("Failed to load profile: " + (e?.message || String(e)));
    return;
  }

  const serverUser = me.user;
  const serverProgress = me.progress;

  CURRENT_USER = { username: serverUser.username, uid: serverUser.uid };

  COINS = Number(serverUser.coins || 0);
  ui.setCoins(COINS);

  const savedLevel = Number(serverProgress?.level || 1);
  levelIndex = clampLevelIndex(savedLevel - 1);

  // WIN popup actions
  ui.onWinNext(async () => {
    ui.hideWinPopup();
    await goNextLevel();
  });

  ui.onWinAd(async () => {
    try {
      const out = await apiAd50();
      COINS = Number(out?.user?.coins ?? COINS);
      ui.setCoins(COINS);
    } catch (e) {
      alert("Ad reward failed: " + (e?.message || String(e)));
    }

    ui.hideWinPopup();
    await goNextLevel();
  });

  // ✅ Hook Skip / Hint buttons
  // (IDs used in your UI: hintBtn and x3Btn)
  document.getElementById("x3Btn")?.addEventListener("click", async () => {
    if (!CURRENT_USER?.uid) return;
    try {
      const out = await apiSkip();
      COINS = Number(out?.user?.coins ?? COINS);
      ui.setCoins(COINS);

      // move to next level after successful skip
      await goNextLevel();
    } catch (e) {
      alert(e?.message || String(e));
    }
  });

  document.getElementById("hintBtn")?.addEventListener("click", async () => {
    if (!CURRENT_USER?.uid) return;
    try {
      const out = await apiHint();
      COINS = Number(out?.user?.coins ?? COINS);
      ui.setCoins(COINS);

      // your game currently has no “show hint path” logic,
      // so we just confirm it worked.
      const mode = out?.mode === "free" ? "Free hint used" : "Paid hint (-50)";
      alert(`${mode}. Free hints left: ${out?.freeLeft ?? 0}`);
    } catch (e) {
      alert(e?.message || String(e));
    }
  });

  // create game
  const firstLevel = levels[levelIndex];
  rewardedThisLevel = false;

  game = createGame({
    BACKEND,
    canvas: ui.canvas,
    getCurrentUser: () => CURRENT_USER,
    level: firstLevel,
    onLevelComplete,
  });

  game.start();
}

// ---------------------------
// Level flow
// ---------------------------
function onLevelComplete() {
  const isLastLevel = levelIndex >= levels.length - 1;

  // ✅ claim +1 once per level completion
  if (!rewardedThisLevel) {
    rewardedThisLevel = true;
    (async () => {
      try {
        const out = await apiClaimLevelComplete(levelIndex + 1);
        COINS = Number(out?.user?.coins ?? COINS);
        ui.setCoins(COINS);
      } catch (e) {
        console.warn("level reward failed:", e);
      }
    })();
  }

  // save progress (next unlocked level)
  const nextLevelNumber = isLastLevel ? 1 : levelIndex + 2;
  (async () => {
    try {
      await apiSetProgress({
        uid: CURRENT_USER.uid,
        level: nextLevelNumber,
        coins: COINS,
      });
    } catch (e) {
      console.warn("progress save failed:", e);
    }
  })();

  ui.showWinPopup({
    levelNumber: levelIndex + 1,
    isLastLevel,
  });
}

async function goNextLevel() {
  const next = levelIndex + 1;

  if (next >= levels.length) {
    levelIndex = 0;
  } else {
    levelIndex = next;
  }

  rewardedThisLevel = false;

  game.setLevel(levels[levelIndex]);

  // best-effort save current progress level
  try {
    await apiSetProgress({
      uid: CURRENT_USER.uid,
      level: levelIndex + 1,
      coins: COINS,
    });
  } catch (e) {
    console.warn("progress save failed:", e);
  }
}

boot();