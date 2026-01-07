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
// Backend helpers (UNCHANGED)
// ---------------------------
function authHeaders() {
  if (!CURRENT_ACCESS_TOKEN) {
    throw new Error("Missing access token. Please login again.");
  }
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

function delay(ms = 5000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readRes(res) {
  const txt = await res.text().catch(() => "");
  let data = {};
  try {
    data = txt ? JSON.parse(txt) : {};
  } catch {}
  return { txt, data };
}

function normalizeErr(e) {
  return e?.message || String(e);
}

function handleAuthExpiredIfNeeded(msg) {
  if (msg.includes("(HTTP 401)") || msg.toLowerCase().includes("invalid pi token")) {
    alert("Session expired. Please login again.");
    return true;
  }
  return false;
}

// ---------------------------
// Boot
// ---------------------------
async function boot() {
  ui = mountUI(document.querySelector("#app"));

  // unlock audio after first gesture
  if (ui.onFirstUserGesture) {
  ui.onFirstUserGesture(() => ensureAudioUnlocked());
}
// settings
const s0 = getSettings();

if (typeof ui.setSoundEnabled === "function") {
  ui.setSoundEnabled(s0.sound);
}

if (typeof ui.setVibrationEnabled === "function") {
  ui.setVibrationEnabled(s0.vibration);
}
  ui.onSoundToggle((v) => {
    setSetting("sound", v);
    if (!v) stopRollSound();
  });
  ui.onVibrationToggle((v) => setSetting("vibration", v));

  subscribeSettings((s) => {
  if (ui.setSoundEnabled) {
    ui.setSoundEnabled(s.sound);
  }

  if (ui.setVibrationEnabled) {
    ui.setVibrationEnabled(s.vibration);
  }

  if (!s.sound) stopRollSound();
});

  // ---------------------------
  // Pi environment check
  // ---------------------------
  const env = await enforcePiEnvironment({
    desktopBlockEl: document.getElementById("desktopBlock"),
  });
  if (!env.ok) return;

  // init Pi SDK (safe to call once)
  initPi();

  // ---------------------------
  // 🔑 LOGIN (RESTORE OR WAIT FOR CLICK)
  // ---------------------------
  await ensurePiLogin({
    BACKEND,
    ui,
    onLogin: ({ user, accessToken }) => {
      CURRENT_USER = user;
      CURRENT_ACCESS_TOKEN = accessToken;
      ui.setUser(user);
    },
  });

  // ---------------------------
  // Load server state AFTER login
  // ---------------------------
  let me;
  try {
    const res = await fetch(`${BACKEND}/api/me`, {
      headers: { ...authHeaders() },
    });
    const { data } = await readRes(res);
    if (!res.ok || !data?.ok) {
      throw new Error(`${data?.error || "api/me failed"} (HTTP ${res.status})`);
    }
    me = data;
  } catch (e) {
    const msg = normalizeErr(e);
    if (!handleAuthExpiredIfNeeded(msg)) alert("Failed to load profile: " + msg);
    return;
  }

  const serverUser = me.user;
  const serverProgress = me.progress;

  CURRENT_USER = { username: serverUser.username, uid: serverUser.uid };

  COINS = Number(serverUser.coins || 0);
  ui.setCoins(COINS);

  const savedLevel = Number(serverProgress?.level || 1);
  levelIndex = Math.max(0, Math.min(savedLevel - 1, levels.length - 1));

  // ---------------------------
  // Game setup
  // ---------------------------
  const firstLevel = levels[levelIndex];
  rewardedThisLevel = false;

  game = createGame({
    canvas: ui.canvas,
    level: firstLevel,
    onLevelComplete,
  });

  game.start();
}

// ---------------------------
// Level flow (UNCHANGED)
// ---------------------------
function onLevelComplete() {
  const isLastLevel = levelIndex >= levels.length - 1;

  if (!rewardedThisLevel) {
    rewardedThisLevel = true;
    (async () => {
      try {
        const res = await fetch(`${BACKEND}/api/rewards/level-complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({ level: levelIndex + 1 }),
        });
        const { data } = await readRes(res);
        COINS = Number(data?.user?.coins ?? COINS);
        ui.setCoins(COINS);
      } catch (e) {
        console.warn("level reward failed:", e);
      }
    })();
  }

  ui.showWinPopup({
    levelNumber: levelIndex + 1,
    isLastLevel,
  });
}

boot();