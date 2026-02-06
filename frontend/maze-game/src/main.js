import "./style.css";
import "./css/ui.css";

import { mountLevelsUI } from "./ui/uiLevels.js";
import { mountUI } from "./ui/ui.js";
import { loadProgress } from "./api/loadProgress.js";
import { createGame } from "./game/game.js";
import { ensurePiLogin } from "./pi/piClient.js";
import { levels } from "./levels/index.js";
import { createWinPopup } from "./ui/uiWin.js";

/* ===================== CONSTANTS ===================== */

const GUEST_PROGRESS_KEY = "guest_progress_v1";
const GUEST_MAX_LEVEL = 5;
const BACKEND = "https://triumphant-gentleness-production.up.railway.app";
const FREE_SKIPS = 3;
const FREE_HINTS = 3;

/* ===================== GLOBAL STATE ===================== */

let CURRENT_USER = null;
let CURRENT_ACCESS_TOKEN = null;
let levelIndex = 0;

/* ===================== HELPERS ===================== */

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
  } catch {
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

/* ===================== API ===================== */

async function apiClaimLevelComplete(levelNumber) {
  if (!CURRENT_ACCESS_TOKEN) return null;

  const res = await fetch(`${BACKEND}/api/rewards/level-complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ level: levelNumber }),
  });

  if (!res.ok) return null;
  return res.json();
}

/* ===================== BOOT ===================== */

async function boot() {
  // restore token
  const storedToken = localStorage.getItem("pi_access_token");
  if (storedToken) CURRENT_ACCESS_TOKEN = storedToken;

  // mount UI to body (mountUI CREATES #app)
  const root = document.body;
  const ui = mountUI(root);

  // lock scroll (iOS)
  document.body.style.position = "fixed";
  document.body.style.width = "100%";
  document.body.style.height = "100%";

  document.addEventListener(
    "touchmove",
    (e) => e.preventDefault(),
    { passive: false }
  );

  // sync user if token exists
  if (CURRENT_ACCESS_TOKEN) {
    fetch(`${BACKEND}/api/me`, {
      headers: { Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => {
        if (me?.user) {
          CURRENT_USER = me.user;
          ui.setUser(me.user);
          ui.setCoins(me.user.coins ?? 0);
        }
      })
      .catch(() => {});
  }

  /* ===================== UI ===================== */

  const winPopup = createWinPopup();
  const levelsUI = mountLevelsUI(root);

  ui.levelsBtn.addEventListener("click", () => {
    levelsUI.open();
  });

  ui.onAccountClick(() => {
    if (CURRENT_USER?.uid) return;
    ui.showWelcome();
    ui.triggerLogin();
  });

  ui.showWelcome();

  /* ===================== GAME ===================== */

  const game = createGame({
    canvas: ui.canvas,
    level: levels[0],
    getCurrentUser: () => CURRENT_USER ?? { username: "Guest", uid: null },

    onLevelComplete({ level }) {
      if (CURRENT_ACCESS_TOKEN) {
        apiClaimLevelComplete(level?.number ?? levelIndex + 1)
          .then((out) => {
            if (out?.user) {
              CURRENT_USER = { ...CURRENT_USER, ...out.user };
              ui.setCoins(out.user.coins ?? 0);
            }
          })
          .catch(() => {});
      }

      winPopup.show({
        levelNumber: level?.number ?? levelIndex + 1,
      });
    },
  });

  function setLevel(i) {
    levelIndex = Math.max(0, Math.min(levels.length - 1, i));
    game.setLevel(levels[levelIndex]);
    ui.setLevel(levelIndex + 1);
  }

  function goNextLevel() {
    setLevel(levelIndex + 1);
  }

  winPopup.onNextLevel(() => {
    winPopup.hide();
    goNextLevel();
  });

  /* ===================== GUEST ===================== */

  ui.onGuestStart(() => {
    CURRENT_USER = { username: "Guest", uid: null };
    CURRENT_ACCESS_TOKEN = null;

    const guestProgress = loadGuestProgress();
    levelsUI.setUnlocked?.(
      Math.min(guestProgress.maxLevel, GUEST_MAX_LEVEL)
    );

    document.body.classList.add("game-running");
    ui.hideWelcome();
    game.start();
  });

  /* ===================== LOGIN ===================== */

  ui.onLoginClick(async () => {
    const result = await ensurePiLogin({
      BACKEND,
      ui,
      onLogin: ({ accessToken }) => {
        CURRENT_ACCESS_TOKEN = accessToken;
      },
    });

    if (!CURRENT_ACCESS_TOKEN && result?.accessToken) {
      CURRENT_ACCESS_TOKEN = result.accessToken;
    }

    if (!CURRENT_ACCESS_TOKEN) return;

    const me = await loadProgress({
      BACKEND,
      token: CURRENT_ACCESS_TOKEN,
    });

    CURRENT_USER = me.user;
    ui.setUser(me.user);
    ui.setCoins(me.user.coins ?? 0);

    const maxLevel = me?.progress?.maxLevel ?? 1;
    levelsUI.setUnlocked?.(maxLevel);

    setLevel(Math.max(0, maxLevel - 1));
    document.body.classList.add("game-running");
    ui.hideWelcome();

    game.start();
  });
}

/* ===================== START ===================== */

window.addEventListener("DOMContentLoaded", boot);