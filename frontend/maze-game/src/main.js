// src/main.js
import "./style.css";

import { mountUI } from "./ui/ui.js";
import { enforcePiEnvironment } from "./pi/piDetect.js";
import { ensurePiLogin } from "./pi/piClient.js";

import { createGame } from "./game/game.js";
import { levels } from "./levels/index.js";

import { getSettings, setSetting, subscribeSettings } from "./settings.js";

// ✅ Audio unlock + stop when toggled off
import { ensureAudioUnlocked, stopRollSound } from "./game/rollSound.js";

const BACKEND = "https://adventuremaze.onrender.com";

let CURRENT_USER = { username: "guest", uid: null };
let CURRENT_ACCESS_TOKEN = null;

let levelIndex = 0;
let game = null;
let ui = null;

// ---------------------------
// ✅ Backend helpers
// ---------------------------
async function apiGetMe() {
  const res = await fetch(`${BACKEND}/api/me`, {
    headers: {
      Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}`,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) throw new Error(data?.error || "api/me failed");
  return data; // { ok:true, user, progress }
}

async function apiSetProgress({ uid, level, coins }) {
  const res = await fetch(`${BACKEND}/progress`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ uid, level, coins }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) throw new Error(data?.error || "progress save failed");
  return data;
}

async function apiAddCoins({ uid, delta }) {
  const res = await fetch(`${BACKEND}/api/users/coins`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ uid, delta }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) throw new Error(data?.error || "coins update failed");
  return data; // { ok:true, user }
}

function clampLevelIndex(i) {
  if (i < 0) return 0;
  if (i >= levels.length) return 0;
  return i;
}

// ---------------------------
// ✅ Boot
// ---------------------------
async function boot() {
  ui = mountUI(document.querySelector("#app"));

  // ✅ unlock audio only after first real user gesture (mobile requirement)
  ui.onFirstUserGesture(() => {
    ensureAudioUnlocked();
  });

  // init toggles from saved settings
  const s0 = getSettings();
  ui.setSoundEnabled(s0.sound);
  ui.setVibrationEnabled(s0.vibration);

  // when user toggles
  ui.onSoundToggle((v) => {
    setSetting("sound", v);
    if (!v) stopRollSound();
  });
  ui.onVibrationToggle((v) => setSetting("vibration", v));

  // keep UI in sync if settings changed elsewhere
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

  // ✅ Mandatory Pi login BEFORE game starts (with session restore)
  const loginRes = await ensurePiLogin({
    BACKEND,
    ui,
    onLogin: ({ user, accessToken }) => {
      CURRENT_USER = user;
      CURRENT_ACCESS_TOKEN = accessToken;

      // Keep header UI consistent
      if (ui?.userPill) ui.userPill.textContent = `User: ${user.username}`;
      if (ui?.loginBtnText) ui.loginBtnText.textContent = "Logged in ✅";
    },
  });

  if (!loginRes?.ok) return;

  // ✅ Load server state (coins + progress)
  let me;
  try {
    me = await apiGetMe();
  } catch (e) {
    alert("Failed to load profile: " + (e?.message || String(e)));
    return;
  }

  const serverUser = me.user;
  const serverProgress = me.progress;

  // trust server as source of truth
  CURRENT_USER = { username: serverUser.username, uid: serverUser.uid };

  // coins on top bar
  ui.setCoins(serverUser.coins || 0);

  // start at saved level (progress.level is 1-based)
  const savedLevel = Number(serverProgress?.level || 1);
  levelIndex = clampLevelIndex(savedLevel - 1);

  // popup button handlers (wire once)
  ui.onWinNext(async () => {
    ui.hideWinPopup();
    await goNextLevel({ viaAd: false });
  });

  ui.onWinAd(async () => {
    try {
      // +50 coins on backend
      const out = await apiAddCoins({ uid: CURRENT_USER.uid, delta: 50 });
      ui.setCoins(out?.user?.coins ?? 0);
    } catch (e) {
      alert("Coins update failed: " + (e?.message || String(e)));
      // still allow next level if you want
    }

    ui.hideWinPopup();
    await goNextLevel({ viaAd: true });
  });

  // create game once (after login)
  const firstLevel = levels[levelIndex];

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
// ✅ Level flow
// ---------------------------
async function onLevelComplete() {
  const isLastLevel = levelIndex >= levels.length - 1;

  // ✅ Save progress to backend right when completed
  // next unlocked level is (levelIndex+2) because current is completed
  const nextLevelNumber = isLastLevel ? 1 : levelIndex + 2;

  try {
    const me = await apiGetMe();
    const coinsNow = Number(me?.user?.coins || 0);

    await apiSetProgress({
      uid: CURRENT_USER.uid,
      level: nextLevelNumber,
      coins: coinsNow,
    });
  } catch (e) {
    // don't block popup if backend fails
    console.warn("progress save failed:", e);
  }

  // show popup
  ui.showWinPopup({
    levelNumber: levelIndex + 1,
    isLastLevel,
  });
}

async function goNextLevel({ viaAd } = {}) {
  const next = levelIndex + 1;

  if (next >= levels.length) {
    levelIndex = 0;
    game.setLevel(levels[levelIndex]);
    return;
  }

  levelIndex = next;
  game.setLevel(levels[levelIndex]);
}

boot();