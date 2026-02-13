import { ui } from "./ui";
import { restartPopup } from "./uiRestarts";
import { game, levels } from "./game";

const BACKEND = import.meta.env.VITE_BACKEND;

let CURRENT_USER = null;
let CURRENT_ACCESS_TOKEN = null;

const FREE_RESTARTS = 3;

/* -----------------------------
   HELPERS
------------------------------ */

function freeRestartsLeft() {
  const used = Number(CURRENT_USER?.free_restarts_used || 0);
  return Math.max(0, FREE_RESTARTS - used);
}

function updateRestartBadge() {
  const badge = document.getElementById("restartCount");
  const btn = document.getElementById("restartBtn");
  if (!badge || !btn) return;

  const left = freeRestartsLeft();

  if (left > 0) {
    badge.textContent = left;
    badge.style.display = "inline-flex";
    btn.disabled = false;
  } else {
    badge.style.display = "none";
    btn.disabled = false; // opens popup instead
  }
}

/* -----------------------------
   LOGIN / BOOT
------------------------------ */

async function boot() {
  ui.onLoginClick(async () => {
    const res = await fetch(`${BACKEND}/api/login`);
    const out = await res.json();
    if (!out?.accessToken) return;

    CURRENT_ACCESS_TOKEN = out.accessToken;

    const me = await fetch(`${BACKEND}/api/me`, {
      headers: {
        Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}`,
      },
    }).then((r) => r.json());

    if (!me?.user) return;

    CURRENT_USER = {
      ...me.user,
      free_skips_used: me.user.free_skips_used ?? 0,
      free_hints_used: me.user.free_hints_used ?? 0,
      free_restarts_used: me.user.free_restarts_used ?? 0,
    };

    updateRestartBadge();
    setTimeout(updateRestartBadge, 0);

    game.setLevel(levels[Math.max(0, (me.progress?.maxLevel ?? 1) - 1)]);
    ui.hideWelcome();
    game.start();
  });
}

/* -----------------------------
   RESTART BUTTON
------------------------------ */

ui.onRestartClick(async () => {
  if (!CURRENT_USER?.uid) {
    ui.showLoginRequired();
    return;
  }

  const freeLeft = freeRestartsLeft();

  if (freeLeft > 0) {
    // free restart
    const out = await fetch(`${BACKEND}/api/restart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ mode: "free" }),
    }).then((r) => r.json());

    if (!out?.ok) {
      alert(out.error);
      return;
    }

    CURRENT_USER = {
      ...CURRENT_USER,
      ...out.user,
      free_restarts_used: out.user.free_restarts_used ?? (CURRENT_USER.free_restarts_used + 1),
    };

    updateRestartBadge();
    game.setLevel(levels[game.levelIndex]);
    return;
  }

  // no free left → popup
  restartPopup.open({ freeLeft: 0 });
});

/* -----------------------------
   POPUP ACTIONS
------------------------------ */

restartPopup.onBuyRestart(async () => {
  const out = await fetch(`${BACKEND}/api/restart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ mode: "coins" }),
  }).then((r) => r.json());

  if (!out?.ok) {
    alert(out.error);
    return;
  }

  CURRENT_USER = { ...CURRENT_USER, ...out.user };
  updateRestartBadge();
  game.setLevel(levels[game.levelIndex]);
  restartPopup.hide();
});

restartPopup.onWatchAdRestart(async () => {
  const out = await fetch(`${BACKEND}/api/restart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CURRENT_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      mode: "ad",
      nonce: crypto.randomUUID(),
    }),
  }).then((r) => r.json());

  if (!out?.ok) {
    alert(out.error);
    return;
  }

  CURRENT_USER = { ...CURRENT_USER, ...out.user };
  updateRestartBadge();
  game.setLevel(levels[game.levelIndex]);
  restartPopup.hide();
});

/* -----------------------------
   START
------------------------------ */

boot();