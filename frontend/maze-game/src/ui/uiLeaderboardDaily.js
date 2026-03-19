import "../css/leaderboardDaily.css";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, 20).map((row, idx) => ({
    uid: String(row?.uid || `row-${idx}`),
    username: String(row?.username || row?.uid || "player"),
    rank: Number(row?.rank || 0) || idx + 1,
    coins_earned: Number(row?.coins_earned || 0),
  }));
}

function mergeRowsWithMe(rows, me) {
  const list = normalizeRows(rows);
  const meUid = String(me?.uid || "");
  const meRank = me?.rank != null ? Number(me.rank) : null;
  const meCoins = Number(me?.coins_earned || 0);
  const meName = String(me?.username || meUid || "player");
  if (!meUid || !meRank || meRank > 20) {
    return list;
  }

  if (list.some((r) => String(r.uid) === meUid)) {
    return list;
  }

  // Prevent duplicate rank labels when cached rows are stale.
  const withoutSameRank = list.filter((r) => Number(r.rank) !== meRank);
  const withMe = [
    ...withoutSameRank,
    {
      uid: meUid,
      username: meName,
      rank: meRank,
      coins_earned: meCoins,
    },
  ];

  withMe.sort((a, b) => {
    const r = Number(a.rank || 0) - Number(b.rank || 0);
    if (r !== 0) return r;
    return String(a.uid).localeCompare(String(b.uid));
  });

  return withMe.slice(0, 20);
}

function hasPositionChanges(previousRows, currentRows) {
  const prevIndex = new Map();
  previousRows.forEach((r, i) => prevIndex.set(String(r.uid), i));
  for (let i = 0; i < currentRows.length; i += 1) {
    const uid = String(currentRows[i].uid);
    if (!prevIndex.has(uid)) continue;
    if (prevIndex.get(uid) !== i) return true;
  }
  return false;
}

export function createDailyLeaderboardPopup() {
  let closeHandler = null;
  let renderVersion = 0;
  let isAnimating = false;

  const overlay = document.createElement("div");
  overlay.className = "leaderboardDailyOverlay hidden";
  overlay.innerHTML = `
    <div class="leaderboardDailyCard">
      <div class="leaderboardDailyHead">
        <div>
          <div class="leaderboardDailyTitle">Daily Ranking</div>
          <div class="leaderboardDailySubtitle">Top players today</div>
        </div>
        <div class="leaderboardDailyServerTimeWrap">
          <div class="leaderboardDailyServerTime" id="leaderboardDailyServerTime">Server: --:--:--</div>
          <div class="leaderboardDailyResetTime" id="leaderboardDailyResetTime">New Day In: --:--:--</div>
        </div>
      </div>
      <div class="leaderboardDailyRows" id="leaderboardDailyRows"></div>
      <div class="leaderboardDailyMe" id="leaderboardDailyMe"></div>
      <button type="button" class="leaderboardDailyContinue" id="leaderboardDailyContinue">Continue</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const rowsEl = overlay.querySelector("#leaderboardDailyRows");
  const meEl = overlay.querySelector("#leaderboardDailyMe");
  const continueBtn = overlay.querySelector("#leaderboardDailyContinue");
  const serverTimeEl = overlay.querySelector("#leaderboardDailyServerTime");
  const resetTimeEl = overlay.querySelector("#leaderboardDailyResetTime");

  let serverTimeBaseMs = null;
  let serverTimeClientStartedMs = null;
  let serverTimeTimer = null;

  function formatServerTime(ms) {
    if (!Number.isFinite(ms)) return "--:--:--";
    try {
      return new Date(ms).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch {
      return "--:--:--";
    }
  }

  function formatResetCountdown(msLeft) {
    const total = Math.max(0, Math.floor(msLeft / 1000));
    const h = String(Math.floor(total / 3600)).padStart(2, "0");
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  function nextUtcResetMs(nowMs) {
    const d = new Date(nowMs);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0, 0);
  }

  function renderServerTime() {
    if (!serverTimeEl) return;
    if (!Number.isFinite(serverTimeBaseMs) || !Number.isFinite(serverTimeClientStartedMs)) {
      serverTimeEl.textContent = "Server: --:--:--";
      if (resetTimeEl) resetTimeEl.textContent = "New Day In: --:--:--";
      return;
    }
    const nowMs = serverTimeBaseMs + (Date.now() - serverTimeClientStartedMs);
    serverTimeEl.textContent = `Server: ${formatServerTime(nowMs)}`;
    if (resetTimeEl) {
      const left = nextUtcResetMs(nowMs) - nowMs;
      resetTimeEl.textContent = `New Day In: ${formatResetCountdown(left)}`;
    }
  }

  function setServerTime(serverMs) {
    const ms = Number(serverMs);
    if (!Number.isFinite(ms)) return;
    serverTimeBaseMs = ms;
    serverTimeClientStartedMs = Date.now();
    renderServerTime();
    if (serverTimeTimer) clearInterval(serverTimeTimer);
    serverTimeTimer = setInterval(renderServerTime, 1000);
  }


  function setContinueDisabled(disabled) {
    if (!continueBtn) return;
    continueBtn.disabled = !!disabled;
    continueBtn.classList.toggle("is-disabled", !!disabled);
  }

  function renderRows(rows, me, loading = false) {
    const topRows = mergeRowsWithMe(rows, me);
    const meUid = String(me?.uid || "");

    if (!topRows.length) {
      const text = loading ? "Loading ranking..." : "No ranked users yet today.";
      rowsEl.innerHTML = `<div class="leaderboardDailyRow leaderboard-row is-empty">${text}</div>`;
      return;
    }

    rowsEl.innerHTML = topRows
      .map((row) => {
        const isMe = meUid && String(row.uid) === meUid;
        const cls = isMe
          ? "leaderboardDailyRow leaderboard-row is-me current-user"
          : "leaderboardDailyRow leaderboard-row";
        return `
          <div class="${cls}" data-uid="${escapeHtml(row.uid)}">
            <span class="rank">#${row.rank}</span>
            <span class="name">${escapeHtml(row.username)}</span>
            <span class="coins">${row.coins_earned}</span>
          </div>
        `;
      })
      .join("");
  }

  function renderMe(me) {
    const rank = me?.rank != null ? Number(me.rank) : null;
    const coins = Number(me?.coins_earned || 0);
    if (!rank) {
      if (me?.public_eligible === false && coins > 0) {
        meEl.textContent = `Your Rank: hidden from public board (${coins} coins)`;
      } else {
        meEl.textContent = "You are not ranked yet today.";
      }
      return;
    }
    meEl.textContent = `Your Rank: #${rank} (${coins} coins)`;
  }

  async function animateRowMovement({ previousRows, rows, me, loading, version }) {
    const prev = mergeRowsWithMe(previousRows, me);
    const cur = mergeRowsWithMe(rows, me);
    const meUid = String(me?.uid || "");

    if (!prev.length || !cur.length || !hasPositionChanges(prev, cur)) {
      renderRows(cur, me, loading);
      renderMe(me);
      setContinueDisabled(false);
      isAnimating = false;
      return;
    }

    renderRows(prev, me, false);
    renderMe(me);
    const prevEls = Array.from(rowsEl.querySelectorAll(".leaderboard-row[data-uid]"));
    const prevTop = new Map(
      prevEls.map((el) => [String(el.getAttribute("data-uid") || ""), el.getBoundingClientRect().top])
    );

    renderRows(cur, me, loading);
    renderMe(me);

    const curEls = Array.from(rowsEl.querySelectorAll(".leaderboard-row[data-uid]"));
    let movedAny = false;

    for (const el of curEls) {
      const uid = String(el.getAttribute("data-uid") || "");
      const newTop = el.getBoundingClientRect().top;
      const oldTop = prevTop.get(uid);

      el.classList.add("moving");
      if (uid === meUid) {
        el.classList.add("moving-current");
      }

      if (oldTop == null) {
        el.style.opacity = "0";
        el.style.transform = "translateY(8px)";
        movedAny = true;
        continue;
      }

      const dy = oldTop - newTop;
      if (Math.abs(dy) > 1) {
        el.style.transform = `translateY(${dy}px)`;
        movedAny = true;
      }
    }

    if (!movedAny) {
      for (const el of curEls) {
        el.classList.remove("moving", "moving-current");
        el.style.transform = "";
        el.style.opacity = "";
      }
      setContinueDisabled(false);
      isAnimating = false;
      return;
    }

    setContinueDisabled(true);
    isAnimating = true;

    void rowsEl.offsetHeight;
    requestAnimationFrame(() => {
      for (const el of curEls) {
        el.style.transform = "translateY(0)";
        el.style.opacity = "1";
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 460));

    if (version !== renderVersion) return;

    for (const el of curEls) {
      el.classList.remove("moving", "moving-current");
      el.style.transform = "";
      el.style.opacity = "";
    }

    setContinueDisabled(false);
    isAnimating = false;
  }

  function hide() {
    overlay.classList.add("hidden");
    setContinueDisabled(false);
    isAnimating = false;
  }

  function show({ rows, me, loading = false, previousRows = null, animateMovement = false, serverTimeMs = null } = {}) {
    renderVersion += 1;
    const version = renderVersion;

    overlay.classList.remove("hidden");

    if (Number.isFinite(Number(serverTimeMs))) {
      setServerTime(Number(serverTimeMs));
    }

    if (animateMovement && Array.isArray(previousRows) && previousRows.length > 0) {
      void animateRowMovement({ previousRows, rows, me, loading, version });
      return;
    }

    renderRows(rows, me, loading);
    renderMe(me);
    setContinueDisabled(Boolean(loading));
    isAnimating = false;
  }
  function onClose(fn) {
    closeHandler = fn;
  }

  continueBtn?.addEventListener("click", () => {
    if (isAnimating) return;
    hide();
    closeHandler?.();
  });

  return {
    show,
    hide,
    onClose,
  };
}











