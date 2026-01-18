// IMPORTS 1
import "./style.css";
import { enforcePiEnvironment } from "./pi/piDetect.js";
import { initPi } from "./pi/piInit.js";
import { ensurePiLogin } from "./pi/piClient.js";

import { createLoginUI } from "./ui/uiLogin.js";
import { mountWelcomeUI } from "./ui/uiWelcome.js";
import { mountUI } from "./ui/ui.js";
import { createGame } from "./game/game.js";
import { levels } from "./levels/index.js";
import { getSettings, setSetting, subscribeSettings } from "./settings.js";
import { ensureAudioUnlocked, stopRollSound } from "./game/rollSound.js";

// CONFIG
const BACKEND = "https://adventuremaze.onrender.com";

let CURRENT_USER = null;
let CURRENT_ACCESS_TOKEN = null;
let levelIndex = 0;
let game = null;
let ui = null;
let COINS = 0;
let rewardedThisLevel = false;

// ---------------------------
// Backend helpers
// ---------------------------
function authHeaders() {
  if (!CURRENT_ACCESS_TOKEN) {
    throw new Error("Missing access token. Please login again.");
  }
  return { Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}` };
}

async function readRes(res) {
  const txt = await res.text().catch(() => "");
  let data = {};
  try { data = txt ? JSON.parse(txt) : {}; } catch {}
  return { txt, data };
}

async function apiGetMe() {
  const res = await fetch(`${BACKEND}/api/me`, {
    headers: authHeaders(),
  });
  const { data } = await readRes(res);
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || "api/me failed");
  }
  return data;
}

async function apiSetProgress({ uid, level, coins }) {
  await fetch(`${BACKEND}/progress`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ uid, level, coins }),
  });
}

async function apiClaimLevelComplete(level) {
  const res = await fetch(`${BACKEND}/api/rewards/level-complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ level }),
  });
  const { data } = await readRes(res);
  if (!res.ok || !data?.ok) throw new Error(data?.error);
  return data;
}


async function boot() {

  // 1️⃣ Enforce Pi environment
  const env = await enforcePiEnvironment({
    desktopBlockEl: document.getElementById("desktopBlock"),
  });
  if (!env.ok) return;
 

  // 2️⃣ Init Pi SDK
  initPi();
   if (!window.Pi?.authenticate) {
    alert("This game works only inside Pi Browser.");
    return;
  }

  // 3️⃣ Root + Login UI
  const root = document.querySelector("#app");
  const loginUI = createLoginUI(root);
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

  loginUI.show("Tap to continue");

  // 4️⃣ Handle login
  loginUI.onLogin(async () => {
    loginUI.setText("Logging in…");
    loginUI.showSpinner();

    try {
      const loginRes = await ensurePiLogin({
        BACKEND,
        onLogin: ({ user, accessToken }) => {
          CURRENT_USER = user;
          CURRENT_ACCESS_TOKEN = accessToken;
          console.log("✅ LOGGED IN:", user);
        },
      });

      if (!loginRes?.ok) {
        loginUI.hideSpinner();
        loginUI.setText("Login failed. Tap to retry");
        return;
      }

      // ✅ Login success
      setTimeout(() => {
        loginUI.hideSpinner();
        loginUI.hide();

        // 5️⃣ Welcome screen
        const welcomeUI = mountWelcomeUI(root, CURRENT_USER);
        welcomeUI.show();

        // ▶️ TAP TO PLAY
        welcomeUI.onStart(() => {
  welcomeUI.hide();

  // 1️⃣ Mount UI
  ui = mountUI(document.querySelector("#app"));


  
  COINS = Number(me.user.coins || 0);
    ui.setCoins(COINS);
    ui.setUser({ username: me.user.username });

    const savedLevel = Number(me.progress?.level || 1);
    levelIndex = Math.max(0, savedLevel - 1);

    ui.showLevelSelect({
      totalLevels: levels.length,
      currentLevel: levelIndex + 1,
      isCompleted: (lvl) => lvl < savedLevel,
    });

  // 4️⃣ START GAME LOOP ✅
  game.start();
});
      }, 400);
    } catch (err) {
      console.error("Login error:", err);
      loginUI.hideSpinner();
      loginUI.setText("Login error. Tap to retry");
    }
  });
}

// 🚀 START APP
boot();