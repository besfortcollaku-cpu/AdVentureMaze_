// src/main.js
import "./style.css";

import { mountUI } from "./ui/ui.js";
import { setupPiLogin } from "./pi/piClient.js";
import { enforcePiEnvironment } from "./pi/piDetect.js";
import { createGame } from "./game/game.js";
import { levels } from "./levels/index.js";

const BACKEND = "https://adventuremaze.onrender.com";

// user state
let CURRENT_USER = { username: "guest", uid: null };
let CURRENT_ACCESS_TOKEN = null;

let levelIndex = 0;
let game = null;

// coins (from backend)
let COINS = 0;

// level reward guard
let rewardedThisLevel = false;

// ---------------------------
// helpers
// ---------------------------
function clampLevelIndex(i) {
  if (i < 0) return 0;
  if (i >= levels.length) return 0;
  return i;
}

function uuid() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function requireToken() {
  if (!CURRENT_ACCESS_TOKEN) throw new Error("Missing access token. Please login again.");
  return { Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}` };
}

function setCoins(ui, n) {
  COINS = Number(n || 0);
  if (ui?.coinCount) ui.coinCount.textContent = String(COINS);
}

async function apiGetMe() {
  const res = await fetch(`${BACKEND}/api/me`, { headers: { ...requireToken() } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) throw new Error(data?.error || "api/me failed");
  return data;
}

async function apiSetProgress({ uid, level, coins }) {
  const res = await fetch(`${BACKEND}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...requireToken() },
    body: JSON.stringify({ uid, level, coins }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) throw new Error(data?.error || "progress save failed");
  return data;
}

async function apiLevelComplete(levelNumber) {
  const res = await fetch(`${BACKEND}/api/rewards/level-complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...requireToken() },
    body: JSON.stringify({ level: levelNumber }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) throw new Error(data?.error || "level-complete failed");
  return data; // { ok, already, user }
}

async function apiAd50() {
  const res = await fetch(`${BACKEND}/api/rewards/ad-50`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...requireToken() },
    body: JSON.stringify({ nonce: `ad50:${CURRENT_USER.uid}:${uuid()}` }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) throw new Error(data?.error || "ad-50 failed");
  return data; // { ok, already, user }
}

async function apiSkip() {
  const res = await fetch(`${BACKEND}/api/skip`, { method: "POST", headers: { ...requireToken() } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) throw new Error(data?.error || "skip failed");
  return data; // { ok, mode, freeLeft, user }
}

async function apiHint() {
  const res = await fetch(`${BACKEND}/api/hint`, { method: "POST", headers: { ...requireToken() } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) throw new Error(data?.error || "hint failed");
  return data; // { ok, mode, freeLeft, user }
}

// ---------------------------
// boot
// ---------------------------
async function boot() {
  // UI
  const ui = mountUI(document.querySelector("#app"));

  // initial label
  if (ui.levelLabel) ui.levelLabel.textContent = levels[levelIndex].name || `LEVEL ${levelIndex + 1}`;
  setCoins(ui, 0);

  // Enforce Pi env
  const env = await enforcePiEnvironment({
    desktopBlockEl: document.getElementById("desktopBlock"),
  });
  if (!env.ok) return;

  // overlays
  function showCompleteOverlay({ painted, total }) {
    ui.overlayTitle.textContent = "Level Complete! 🎉";
    ui.overlayText.textContent = `You painted all tiles (${painted}/${total}).`;
    ui.overlay.style.display = "block";

    const nextIdx = levelIndex + 1;
    if (nextIdx < levels.length) {
      ui.nextLevelBtn.textContent = `Next Level (${nextIdx + 1})`;
      ui.nextLevelBtn.disabled = false;
    } else {
      ui.nextLevelBtn.textContent = "More levels soon";
      ui.nextLevelBtn.disabled = true;
    }
  }

  function hideCompleteOverlay() {
    ui.overlay.style.display = "none";
  }

  async function goToLevel(nextIdx) {
    levelIndex = clampLevelIndex(nextIdx);
    rewardedThisLevel = false;

    if (ui.levelLabel) ui.levelLabel.textContent = levels[levelIndex].name || `LEVEL ${levelIndex + 1}`;
    game.setLevel(levels[levelIndex]);

    // save progress (best effort)
    if (CURRENT_USER?.uid) {
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
  }

  // create game immediately (guest works; rewards require login)
  game = createGame({
    BACKEND,
    canvas: ui.canvas,
    level: levels[levelIndex],
    onLevelComplete: async ({ painted, total }) => {
      showCompleteOverlay({ painted, total });

      // +1 coin once per level completion (requires login)
      if (!rewardedThisLevel && CURRENT_ACCESS_TOKEN && CURRENT_USER?.uid) {
        rewardedThisLevel = true;
        try {
          const out = await apiLevelComplete(levelIndex + 1);
          if (out?.user?.coins != null) setCoins(ui, out.user.coins);
        } catch (e) {
          console.warn("level-complete failed:", e);
        }
      }
    },
  });

  // Next level button
  ui.nextLevelBtn.addEventListener("click", async () => {
    const nextIdx = levelIndex + 1;
    if (nextIdx >= levels.length) return;
    hideCompleteOverlay();
    await goToLevel(nextIdx);
  });

  // Watch ad button (+50 coins) then go next
  ui.watchAdBtn.addEventListener("click", async () => {
    if (!CURRENT_ACCESS_TOKEN || !CURRENT_USER?.uid) {
      alert("Please login first.");
      return;
    }

    try {
      const out = await apiAd50();
      if (out?.user?.coins != null) setCoins(ui, out.user.coins);
    } catch (e) {
      alert(e?.message || String(e));
      return;
    }

    hideCompleteOverlay();
    const nextIdx = levelIndex + 1;
    if (nextIdx < levels.length) await goToLevel(nextIdx);
  });

  // Hint (-50 after 3 free)
  document.getElementById("hintBtn")?.addEventListener("click", async () => {
    if (!CURRENT_ACCESS_TOKEN || !CURRENT_USER?.uid) {
      alert("Please login first.");
      return;
    }

    try {
      const out = await apiHint();
      if (out?.user?.coins != null) setCoins(ui, out.user.coins);

      // No built-in hint renderer in this game yet (kept safe)
      const mode = out?.mode === "free" ? "Free hint used" : "-50 coins for hint";
      alert(`${mode}. Free hints left: ${out?.freeLeft ?? 0}`);
    } catch (e) {
      alert(e?.message || String(e));
    }
  });

  // Skip (-50 after 3 free) => go next level
  document.getElementById("x3Btn")?.addEventListener("click", async () => {
    if (!CURRENT_ACCESS_TOKEN || !CURRENT_USER?.uid) {
      alert("Please login first.");
      return;
    }

    try {
      const out = await apiSkip();
      if (out?.user?.coins != null) setCoins(ui, out.user.coins);

      const nextIdx = levelIndex + 1;
      if (nextIdx >= levels.length) {
        alert("No more levels to skip to (add more levels).");
        return;
      }

      hideCompleteOverlay();
      await goToLevel(nextIdx);
    } catch (e) {
      alert(e?.message || String(e));
    }
  });

  // other buttons (leave as placeholders)
  document.getElementById("settings")?.addEventListener("click", () => alert("Settings later"));
  document.getElementById("controls")?.addEventListener("click", () => alert("Swipe to move"));
  document.getElementById("paint")?.addEventListener("click", () => alert("Paint shop later"));
  document.getElementById("trophy")?.addEventListener("click", () => alert("Trophies later"));
  document.getElementById("noads")?.addEventListener("click", () => alert("Remove ads later"));

  // Pi login (updates state + loads server coins/progress)
  setupPiLogin({
    BACKEND,
    loginBtn: ui.loginBtn,
    loginBtnText: ui.loginBtnText,
    userPill: ui.userPill,
    onLogin: async ({ user, accessToken }) => {
      CURRENT_USER = user;
      CURRENT_ACCESS_TOKEN = accessToken;

      try {
        const me = await apiGetMe();
        const serverUser = me.user;
        const serverProgress = me.progress;

        setCoins(ui, Number(serverUser?.coins || 0));

        const savedLevel = Number(serverProgress?.level || 1);
        await goToLevel(clampLevelIndex(savedLevel - 1));
      } catch (e) {
        console.warn("api/me failed:", e);
      }
    },
  });

  game.start();
}

boot();