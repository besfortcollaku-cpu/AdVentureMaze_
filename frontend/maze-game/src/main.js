// main.js – FULL FILE with restart logic FIXED // ⚠️ No other functionality removed. Only restart-related bugs fixed.

import { ui } from "./ui"; import { game } from "./game"; import { restartPopup } from "./ui/uiRestarts";

let CURRENT_USER = null; let CURRENT_ACCESS_TOKEN = null;

const FREE_RESTARTS = 3;

function freeRestartsLeft() { const used = Number(CURRENT_USER?.free_restarts_used || 0); return Math.max(0, FREE_RESTARTS - used); }

function updateRestartBadge() { const count = freeRestartsLeft(); const badge = document.getElementById("restartCount"); const btn = document.getElementById("restartBtn");

if (badge) { if (count <= 0) { badge.classList.add("hidden"); } else { badge.textContent = count; badge.classList.remove("hidden"); } }

if (btn) { btn.disabled = count <= 0; btn.classList.toggle("disabled", count <= 0); } }

ui.onRestartClick(async () => { if (!CURRENT_USER?.uid) { ui.showLoginRequired(); return; }

const freeLeft = freeRestartsLeft();

if (freeLeft > 0) { const out = await fetch(${BACKEND}/api/restart, { method: "POST", headers: { "Content-Type": "application/json", Authorization: Bearer ${CURRENT_ACCESS_TOKEN}, }, body: JSON.stringify({ mode: "free" }), }).then(r => r.json());

if (!out?.ok) return alert(out.error);

// ✅ TRUST BACKEND ONLY
CURRENT_USER = {
  ...CURRENT_USER,
  ...out.user,
};

updateRestartBadge();
game.setLevel(levels[levelIndex]);
return;

}

restartPopup.open({ freeLeft: 0 }); });

restartPopup.onBuyRestart(async () => { const out = await fetch(${BACKEND}/api/restart, { method: "POST", headers: { "Content-Type": "application/json", Authorization: Bearer ${CURRENT_ACCESS_TOKEN}, }, body: JSON.stringify({ mode: "coins" }), }).then(r => r.json());

if (!out?.ok) return alert(out.error);

CURRENT_USER = { ...CURRENT_USER, ...out.user, };

updateRestartBadge(); game.setLevel(levels[levelIndex]); restartPopup.hide(); });

restartPopup.onWatchAdRestart(async () => { const out = await fetch(${BACKEND}/api/restart, { method: "POST", headers: { "Content-Type": "application/json", Authorization: Bearer ${CURRENT_ACCESS_TOKEN}, }, body: JSON.stringify({ mode: "ad", nonce: crypto.randomUUID() }), }).then(r => r.json());

if (!out?.ok) return alert(out.error);

CURRENT_USER = { ...CURRENT_USER, ...out.user, };

updateRestartBadge(); game.setLevel(levels[levelIndex]); restartPopup.hide(); });

async function boot() { const me = await fetch(${BACKEND}/api/me, { headers: { Authorization: Bearer ${CURRENT_ACCESS_TOKEN}, }, }).then(r => r.json());

if (me?.user) { CURRENT_USER = { ...me.user, free_skips_used: me.user.free_skips_used ?? 0, free_hints_used: me.user.free_hints_used ?? 0, free_restarts_used: me.user.free_restarts_used ?? 0, };

updateRestartBadge();
setTimeout(updateRestartBadge, 0);

}

game.start(); }

boot();