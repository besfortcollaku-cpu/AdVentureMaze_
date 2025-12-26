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

// coins (local)
const COINS_KEY = "am_coins";
let coins = Number(localStorage.getItem(COINS_KEY) || "0");

function saveCoins() {
  localStorage.setItem(COINS_KEY, String(coins));
  ui?.setCoins(coins);
}

async function boot() {
  ui = mountUI(document.querySelector("#app"));
  ui.setCoins(coins);

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

    // ✅ if user enables sound, try to unlock/resume (safe no-op if already unlocked)
    if (v) ensureAudioUnlocked();

    // ✅ if user disables sound while rolling, stop immediately
    if (!v) stopRollSound();
  });

  ui.onVibrationToggle((v) => setSetting("vibration", v));

  // keep UI in sync if settings changed elsewhere
  subscribeSettings((s) => {
    ui.setSoundEnabled(s.sound);
    ui.setVibrationEnabled(s.vibration);

    // ✅ if settings changed to sound=false from elsewhere, stop roll
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

      // keep UI consistent
      ui?.setUser?.(user);
      if (ui?.userPill) ui.userPill.textContent = `User: ${user.username}`;
      if (ui?.loginBtnText) ui.loginBtnText.textContent = "Logged in ✅";
    },
  });

  // NOTE: with the fixed ensurePiLogin, this should always be ok:true eventually.
  if (!loginRes?.ok) return;

  // popup button handlers (wire once)
  ui.onWinNext(() => {
    ui.hideWinPopup();
    goNextLevel({ viaAd: false });
  });

  ui.onWinAd(() => {
    // ✅ later we connect real ad SDK
    // for now: instantly reward +50
    coins += 50;
    saveCoins();

    ui.hideWinPopup();
    goNextLevel({ viaAd: true });
  });

  // create game once (after login)
  levelIndex = clampLevelIndex(levelIndex);
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

function clampLevelIndex(i) {
  if (i < 0) return 0;
  if (i >= levels.length) return 0;
  return i;
}

function onLevelComplete() {
  // ✅ stop rolling sound so popup is clean
  stopRollSound();

  const isLastLevel = levelIndex >= levels.length - 1;

  // show popup (locked fullscreen)
  ui.showWinPopup({
    levelNumber: levelIndex + 1,
    isLastLevel,
  });
}

function goNextLevel({ viaAd } = {}) {
  // compute next index
  const next = levelIndex + 1;

  // if last -> restart
  if (next >= levels.length) {
    levelIndex = 0;
    game.setLevel(levels[levelIndex]);
    return;
  }

  levelIndex = next;
  game.setLevel(levels[levelIndex]);
}

boot();
```0