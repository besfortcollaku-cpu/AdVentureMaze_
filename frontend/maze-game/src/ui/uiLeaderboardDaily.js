import "../css/leaderboardDaily.css";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function createDailyLeaderboardPopup() {
  let closeHandler = null;

  const overlay = document.createElement("div");
  overlay.className = "leaderboardDailyOverlay hidden";
  overlay.innerHTML = `
    <div class="leaderboardDailyCard">
      <div class="leaderboardDailyTitle">Daily Ranking</div>
      <div class="leaderboardDailySubtitle">Top players today</div>
      <div class="leaderboardDailyRows" id="leaderboardDailyRows"></div>
      <div class="leaderboardDailyMe" id="leaderboardDailyMe"></div>
      <button type="button" class="leaderboardDailyContinue" id="leaderboardDailyContinue">Continue</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const rowsEl = overlay.querySelector("#leaderboardDailyRows");
  const meEl = overlay.querySelector("#leaderboardDailyMe");
  const continueBtn = overlay.querySelector("#leaderboardDailyContinue");

  function renderRows(rows, me) {
    const topRows = Array.isArray(rows) ? rows.slice(0, 20) : [];
    const meUid = String(me?.uid || "");
    if (!topRows.length) {
      rowsEl.innerHTML = `<div class="leaderboardDailyRow is-empty">No ranked users yet today.</div>`;
      return;
    }

    rowsEl.innerHTML = topRows
      .map((row) => {
        const rank = Number(row?.rank || 0) || "-";
        const uid = String(row?.uid || "");
        const username = escapeHtml(String(row?.username || uid || "player"));
        const coins = Number(row?.coins_earned || 0);
        const isMe = meUid && uid === meUid;
        const cls = isMe ? "leaderboardDailyRow is-me" : "leaderboardDailyRow";
        return `
          <div class="${cls}">
            <span class="rank">#${rank}</span>
            <span class="name">${username}</span>
            <span class="coins">${coins}</span>
          </div>
        `;
      })
      .join("");
  }

  function renderMe(me) {
    const rank = me?.rank != null ? Number(me.rank) : null;
    const coins = Number(me?.coins_earned || 0);
    if (!rank) {
      meEl.textContent = "You are not ranked yet today.";
      return;
    }
    meEl.textContent = `Your Rank: #${rank} (${coins} coins)`;
  }

  function hide() {
    overlay.classList.add("hidden");
  }

  function show({ rows, me } = {}) {
    renderRows(rows, me);
    renderMe(me);
    overlay.classList.remove("hidden");
  }

  function onClose(fn) {
    closeHandler = fn;
  }

  continueBtn?.addEventListener("click", () => {
    hide();
    closeHandler?.();
  });

  return {
    show,
    hide,
    onClose,
  };
}