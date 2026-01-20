import "./style.css";

import { mountUI } from "./ui/ui.js";
import { enforcePiEnvironment } from "./pi/piDetect.js";
import { initPi } from "./pi/piInit.js";
import { ensurePiLogin } from "./pi/piClient.js";

import { createGame } from "./game/game.js";
import { levels } from "./levels/index.js";

import { ensureAudioUnlocked } from "./game/rollSound.js";

const BACKEND = "https://adventuremaze.onrender.com";

let CURRENT_USER = { username: "guest", uid: null };
let CURRENT_ACCESS_TOKEN = null;

let levelIndex = 0;
let game = null;
let ui = null;

let COINS = 0;
let rewardedThisLevel = false;

// ---------------------------
// Helpers
// ---------------------------
function authHeaders() {
  return { Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}` };
}

function clampLevelIndex(i) {
  if (i < 0) return 0;
  if (i >= levels.length) return 0;
  return i;
}

async function apiGetMe() {
  const res = await fetch(`${BACKEND}/api/me`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error("api/me failed");
  return data;
}

async function apiSetProgress({ uid, level, coins }) {
  await fetch(`${BACKEND}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ uid, level, coins }),
  });
}

async function apiClaimLevelComplete(level) {
  await fetch(`${BACKEND}/api/rewards/level-complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ level }),
  });
}

// ---------------------------
// Boot
// ---------------------------
async function boot() {
  ui = mountUI(document.querySelector("#app"));

  const env = await enforcePiEnvironment({
    desktopBlockEl: document.getElementById("desktopBlock"),
  });
  if (!env.ok) return;

  initPi();

  const loginRes = await ensurePiLogin({
    BACKEND,
    ui,
    onLogin: ({ user, accessToken }) => {
      CURRENT_USER = user;
      CURRENT_ACCESS_TOKEN = accessToken;
      ui.userPill.textContent = user.username;
      ui.loginBtnText.textContent = "✅";
    },
  });

  if (!loginRes?.ok) return;

  const me = await apiGetMe();
  const serverUser = me.user;
  const serverProgress = me.progress;

  const savedLevel = Number(serverProgress?.level || 1);
  levelIndex = clampLevelIndex(savedLevel - 1);
  const UNLOCKED_LEVEL = savedLevel;

  COINS = Number(serverUser.coins || 0);

  ui.setCoins(COINS);
  ui.setLevel(savedLevel);

  game = createGame({
    onWin: handleWin,
    onLose: handleLose,
  });

  game.setLevel(levels[levelIndex]);
  game.start();

  document.getElementById("controls")?.addEventListener("click", () => {
    ui.showLevelSelect({
      totalLevels: levels.length,
      currentLevel: levelIndex + 1,
      isCompleted: (lvl) => lvl <= UNLOCKED_LEVEL,
    });
  });

  ui.onLevelSelect((selectedIndex) => {
    levelIndex = clampLevelIndex(selectedIndex);
    rewardedThisLevel = true;
    game.setLevel(levels[levelIndex]);
    ui.setLevel(levelIndex + 1);
  });

  ui.onFirstUserGesture(() => ensureAudioUnlocked());
}

// ---------------------------
// Game Flow
// ---------------------------
function handleWin() {
  if (!rewardedThisLevel) {
    rewardedThisLevel = true;
    apiClaimLevelComplete(levelIndex + 1).catch(() => {});
  }

  ui.showWinPopup({
    levelNumber: levelIndex + 1,
    isLastLevel: levelIndex >= levels.length - 1,
  });
}

function handleLose() {}

async function goNextLevel() {
  levelIndex = levelIndex + 1 >= levels.length ? 0 : levelIndex + 1;
  rewardedThisLevel = false;

  game.setLevel(levels[levelIndex]);
  ui.setLevel(levelIndex + 1);

  await apiSetProgress({
    uid: CURRENT_USER.uid,
    level: levelIndex + 1,
    coins: COINS,
  });
}

// ---------------------------
// Start
// ---------------------------
boot();