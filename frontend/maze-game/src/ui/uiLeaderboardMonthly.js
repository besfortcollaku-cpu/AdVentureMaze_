import "../css/leaderboardMonthly.css";

const LEADERBOARD_RANK_STORAGE_KEY = "maze_monthly_rank_snapshot";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMonthKey(monthKey) {
  const raw = String(monthKey || "").trim();
  if (!/^\d{4}-\d{2}$/.test(raw)) return "";
  const [year, month] = raw.split("-");
  const date = new Date(`${year}-${month}-01T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return `${year}-${month}`;
  return date.toLocaleString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
}

function getSeasonEndMs(monthKey) {
  const raw = String(monthKey || "").trim();
  if (!/^\d{4}-\d{2}$/.test(raw)) return null;
  const [year, month] = raw.split("-").map(Number);
  if (!year || !month) return null;
  return Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1, 0, 0, 0, 0);
}

function formatCountdown(monthKey) {
  const endMs = getSeasonEndMs(monthKey);
  if (!Number.isFinite(endMs)) return "";
  const diff = Math.max(0, endMs - Date.now());
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) return `Season ends in ${days}d ${hours}h`;
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `Season ends in ${hours}h ${minutes}m`;
}

function formatRank(rank) {
  const n = Number(rank);
  return Number.isFinite(n) && n > 0 ? `#${n}` : "-";
}

function renderSummaryRow(label, value) {
  if (value == null || value === "") return "";
  return `<div class="leaderboardMonthlySummaryRow"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function getTierOverviewRows(tierCutoffs = []) {
  const dynamic = Array.isArray(tierCutoffs) ? tierCutoffs : [];
  const ranges = Object.fromEntries(
    dynamic.map((row) => [String(row?.tierName || "").toUpperCase(), row])
  );

  return [
    { name: "A", label: "Champion", shareText: "Top 1%", cutoff: ranges.A || null },
    { name: "B", label: "Elite", shareText: "Next 4%", cutoff: ranges.B || null },
    { name: "C", label: "Advanced", shareText: "Next 15%", cutoff: ranges.C || null },
    { name: "D", label: "Qualified", shareText: "Next 30%", cutoff: ranges.D || null },
  ];
}

function readPreviousRank(monthKey, uid) {
  try {
    const raw = localStorage.getItem(LEADERBOARD_RANK_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || parsed.monthKey !== monthKey || parsed.uid !== uid) return null;
    const rank = Number(parsed.rank);
    return Number.isFinite(rank) && rank > 0 ? rank : null;
  } catch {
    return null;
  }
}

function storeCurrentRank(monthKey, uid, rank) {
  try {
    if (!monthKey || !uid || !rank) return;
    localStorage.setItem(
      LEADERBOARD_RANK_STORAGE_KEY,
      JSON.stringify({ monthKey, uid, rank: Number(rank) })
    );
  } catch {}
}

function getRankMovement(summary) {
  const monthKey = String(summary?.monthKey || "").trim();
  const uid = String(summary?.uid || "").trim();
  const currentRank = Number(summary?.currentRank || 0);
  if (!monthKey || !uid || !currentRank) return null;

  const previousRank = readPreviousRank(monthKey, uid);
  storeCurrentRank(monthKey, uid, currentRank);
  if (!previousRank) return null;
  if (currentRank < previousRank) return `↑ moved up from #${previousRank}`;
  if (currentRank > previousRank) return `↓ moved down from #${previousRank}`;
  return `→ rank unchanged`;
}

function renderProjectedStatus(summary) {
  const tierLabel = String(summary?.projectedTierLabel || summary?.projectedTierName || "").trim();
  const nextTier = String(summary?.nextTierName || "").trim();
  const needed = summary?.rpNeededForNextTier != null ? Number(summary.rpNeededForNextTier) : null;

  if (tierLabel) {
    if (nextTier && needed != null) {
      return `You are currently in ${tierLabel}. ${needed} Score needed to reach ${nextTier}.`;
    }
    return `You are currently in ${tierLabel}.`;
  }

  if (nextTier && needed != null) {
    return `No tier yet - keep playing to qualify. ${needed} Score needed to reach ${nextTier}.`;
  }

  return `No tier yet - keep playing to qualify.`;
}

function renderActivityHint(summary) {
  const dailyRp = Number(summary?.dailyRp || 0);
  if (dailyRp <= 0) return `Earn more Score today to climb the leaderboard.`;
  if (dailyRp < 10) return `A little more Score today can move you up the board.`;
  if (dailyRp < 30) return `Daily Score is capped - keep progressing steadily.`;
  return `Strong day. Keep the momentum going before the season ends.`;
}

function renderQualificationStatus(summary) {
  const tier = String(summary?.projectedTierLabel || summary?.projectedTierName || "").trim();
  return tier ? "Qualified for seasonal rewards" : "Not yet qualified for rewards";
}

function getScoreGapText(items, summary) {
  const meRank = Number(summary?.currentRank || 0);
  const meScore = Number(summary?.rpScore || 0);
  if (!meRank || !Array.isArray(items) || meRank <= 1) return "";
  const above = items.find((item) => Number(item?.rank || 0) === meRank - 1);
  if (!above) return "";
  const gap = Math.max(0, Number(above?.rpScore || 0) - meScore + 1);
  return gap > 0 ? `${gap} Score to pass rank #${meRank - 1}` : "";
}

export function mountLeaderboardMonthlyUI(root) {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="leaderboardMonthlyOverlay" id="leaderboardMonthlyOverlay" aria-hidden="true">
      <div class="leaderboardMonthlyCard">
        <div class="leaderboardMonthlyTopBar">
          <div>
            <div class="leaderboardMonthlyTitle">Leaderboard</div>
            <div class="leaderboardMonthlySeason" id="leaderboardMonthlySeason">Season: --</div>
            <div class="leaderboardMonthlyCountdown" id="leaderboardMonthlyCountdown"></div>
          </div>
          <button class="leaderboardMonthlyClose" id="leaderboardMonthlyClose" type="button">X</button>
        </div>

        <div class="leaderboardMonthlyScroll">
          <div class="leaderboardMonthlyContent">
            <div class="leaderboardMonthlySection">
              <div class="leaderboardMonthlySectionTitle">Your Summary</div>
              <div class="leaderboardMonthlyStatus" id="leaderboardMonthlySummaryStatus">Loading...</div>
              <div class="leaderboardMonthlySummaryHighlight hidden" id="leaderboardMonthlySummaryHighlight"></div>
              <div class="leaderboardMonthlySummaryCard" id="leaderboardMonthlySummaryCard"></div>
            </div>

            <div class="leaderboardMonthlySection">
              <div class="leaderboardMonthlySectionTitle">Season Rewards</div>
              <div class="leaderboardMonthlyRewardsIntro">
                Monthly rewards are based on Score and leaderboard standing.
              </div>
              <div class="leaderboardMonthlyRewardsIntro secondary">
                Higher tiers unlock larger seasonal rewards.
              </div>
              <div class="leaderboardMonthlySeasonStatus" id="leaderboardMonthlySeasonStatus"></div>
              <div class="leaderboardMonthlyActivityHint" id="leaderboardMonthlyActivityHint"></div>
              <div class="leaderboardMonthlyTierGrid" id="leaderboardMonthlyTierGrid"></div>
              <div class="leaderboardMonthlyResetNotice">
                Score resets at the end of each season. Coins are not reset.
              </div>
            </div>

            <div class="leaderboardMonthlySection">
              <div class="leaderboardMonthlyHead">
                <span>Top Players</span>
                <button id="leaderboardMonthlyRefresh" class="leaderboardMonthlyMiniBtn" type="button">Refresh</button>
              </div>
              <div class="leaderboardMonthlyStatus" id="leaderboardMonthlyListStatus">Loading...</div>
              <div class="leaderboardMonthlyRows" id="leaderboardMonthlyRows"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  root.appendChild(wrap);

  const overlay = root.querySelector("#leaderboardMonthlyOverlay");
  const closeBtn = root.querySelector("#leaderboardMonthlyClose");
  const refreshBtn = root.querySelector("#leaderboardMonthlyRefresh");
  const seasonEl = root.querySelector("#leaderboardMonthlySeason");
  const countdownEl = root.querySelector("#leaderboardMonthlyCountdown");
  const summaryStatusEl = root.querySelector("#leaderboardMonthlySummaryStatus");
  const summaryHighlightEl = root.querySelector("#leaderboardMonthlySummaryHighlight");
  const summaryCardEl = root.querySelector("#leaderboardMonthlySummaryCard");
  const seasonStatusEl = root.querySelector("#leaderboardMonthlySeasonStatus");
  const activityHintEl = root.querySelector("#leaderboardMonthlyActivityHint");
  const tierGridEl = root.querySelector("#leaderboardMonthlyTierGrid");
  const listStatusEl = root.querySelector("#leaderboardMonthlyListStatus");
  const rowsEl = root.querySelector("#leaderboardMonthlyRows");
  let latestMonthKey = "";
  let countdownTimer = null;

  function renderSummary(summary) {
    if (!summaryCardEl) return;
    const rankMovement = getRankMovement(summary);

    const rows = [
      renderSummaryRow("Rank", summary?.currentRank ? `#${summary.currentRank}` : null),
      renderSummaryRow("Score", Number(summary?.rpScore || 0)),
      renderSummaryRow("Daily Score", summary?.dailyRp != null ? Number(summary.dailyRp) : null),
      renderSummaryRow("Current Tier", summary?.projectedTierLabel || summary?.projectedTierName || null),
      renderSummaryRow("Next Tier", summary?.nextTierName || null),
      renderSummaryRow(
        "Score Needed",
        summary?.nextTierName && summary?.rpNeededForNextTier != null
          ? Number(summary.rpNeededForNextTier)
          : null
      ),
    ].filter(Boolean);

    if (!rows.length) {
      summaryCardEl.innerHTML = `<div class="leaderboardMonthlyEmpty">No leaderboard data yet.</div>`;
      return;
    }

    const progressLine =
      summary?.nextTierName && summary?.rpNeededForNextTier != null
        ? `<div class="leaderboardMonthlyProgressLine">${escapeHtml(String(summary.rpNeededForNextTier))} Score to reach ${escapeHtml(String(summary.nextTierName))}</div>`
        : "";

    summaryCardEl.innerHTML = `${rows.join("")}${progressLine}`;

    if (summaryHighlightEl) {
      summaryHighlightEl.textContent = rankMovement || "";
      summaryHighlightEl.classList.toggle("hidden", !rankMovement);
    }
  }

  function renderSeasonRewards(summary, listOut) {
    if (seasonStatusEl) {
      seasonStatusEl.textContent = renderProjectedStatus(summary || {});
    }
    if (activityHintEl) {
      const qualification = renderQualificationStatus(summary || {});
      const activityHint = renderActivityHint(summary || {});
      const scoreGap = getScoreGapText(listOut?.items || [], summary || {});
      activityHintEl.innerHTML = `
        <div class="leaderboardMonthlyHintStrong">${escapeHtml(qualification)}</div>
        <div>${escapeHtml(activityHint)}</div>
        ${scoreGap ? `<div class="leaderboardMonthlyGapLine">${escapeHtml(scoreGap)}</div>` : ""}
      `;
    }

    if (!tierGridEl) return;

    const tiers = getTierOverviewRows(listOut?.tierCutoffs);
    tierGridEl.innerHTML = tiers
      .map((tier) => {
        const isCurrent = String(summary?.projectedTierName || "").toUpperCase() === tier.name;
        const minRp = tier.cutoff?.minRpScore != null ? Number(tier.cutoff.minRpScore) : null;
        const cutoffText = minRp != null ? `Current cutoff: ${minRp} Score` : "Season tier";

        return `
          <div class="leaderboardMonthlyTierCard${isCurrent ? " is-current" : ""}">
            <div class="leaderboardMonthlyTierTop">
              <span class="leaderboardMonthlyTierName">${escapeHtml(tier.label)}</span>
              <span class="leaderboardMonthlyTierShare">${escapeHtml(tier.shareText)}</span>
            </div>
            <div class="leaderboardMonthlyTierMeta">${escapeHtml(cutoffText)}</div>
          </div>
        `;
      })
      .join("");
  }

  function updateCountdown() {
    if (!countdownEl) return;
    countdownEl.textContent = latestMonthKey ? formatCountdown(latestMonthKey) : "";
  }

  function startCountdown() {
    stopCountdown();
    updateCountdown();
    countdownTimer = window.setInterval(updateCountdown, 60000);
  }

  function stopCountdown() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  function renderItems(items, meUid) {
    if (!rowsEl) return;
    const list = Array.isArray(items) ? items : [];
    const meRank = Array.isArray(items)
      ? Number(list.find((item) => String(item?.uid || "") === String(meUid || ""))?.rank || 0)
      : 0;
    if (!list.length) {
      rowsEl.innerHTML = `<div class="leaderboardMonthlyRow is-empty">No leaderboard data yet.</div>`;
      return;
    }

    rowsEl.innerHTML = list
      .map((item) => {
        const uid = String(item?.uid || "player");
        const isMe = meUid && uid === meUid;
        const rankNum = Number(item?.rank || 0);
        const isNearMe = meRank > 0 && !isMe && Math.abs(rankNum - meRank) <= 2;
        const tierLabel = String(item?.projectedTierLabel || item?.projectedTierName || "-");
        return `
          <div class="leaderboardMonthlyRow${isMe ? " is-me" : ""}${isNearMe ? " is-near" : ""}">
            <span class="rank">${escapeHtml(formatRank(item?.rank))}</span>
            <span class="name">${escapeHtml(uid)}</span>
            <span class="score">${escapeHtml(String(Number(item?.rpScore || 0)))}</span>
            <span class="tier">${escapeHtml(tierLabel)}</span>
          </div>
        `;
      })
      .join("");
  }

  async function refresh() {
    const listApi = window.__maze?.getLeaderboard;
    const meApi = window.__maze?.getMyLeaderboardSummary;

    if (typeof listApi !== "function" || typeof meApi !== "function") {
      if (summaryStatusEl) summaryStatusEl.textContent = "Leaderboard unavailable.";
      if (listStatusEl) listStatusEl.textContent = "Leaderboard unavailable.";
      if (rowsEl) rowsEl.innerHTML = "";
      if (summaryCardEl) summaryCardEl.innerHTML = "";
      return;
    }

    if (summaryStatusEl) summaryStatusEl.textContent = "Loading...";
    if (listStatusEl) listStatusEl.textContent = "Loading...";

    try {
      const [listOut, meOut] = await Promise.all([
        listApi({ limit: 50, offset: 0 }),
        meApi(),
      ]);

      if (seasonEl) {
        const monthKey = listOut?.monthKey || meOut?.monthKey || "";
        latestMonthKey = String(monthKey || "");
        seasonEl.textContent = monthKey ? `Season: ${formatMonthKey(monthKey)}` : "Season: --";
      }
      updateCountdown();

      renderSummary(meOut || {});
      renderSeasonRewards(meOut || {}, listOut || {});
      renderItems(listOut?.items || [], meOut?.uid || "");

      if (summaryStatusEl) summaryStatusEl.textContent = "";
      if (listStatusEl) listStatusEl.textContent = (listOut?.items || []).length ? "" : "No leaderboard data yet";
    } catch {
      if (summaryStatusEl) summaryStatusEl.textContent = "Failed to load leaderboard";
      if (listStatusEl) listStatusEl.textContent = "Failed to load leaderboard";
      latestMonthKey = "";
      updateCountdown();
      if (summaryHighlightEl) {
        summaryHighlightEl.textContent = "";
        summaryHighlightEl.classList.add("hidden");
      }
      if (seasonStatusEl) seasonStatusEl.textContent = "";
      if (activityHintEl) activityHintEl.textContent = "";
      if (tierGridEl) tierGridEl.innerHTML = "";
      if (rowsEl) rowsEl.innerHTML = "";
      if (summaryCardEl) summaryCardEl.innerHTML = "";
    }
  }

  function show() {
    if (!overlay) return;
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
    startCountdown();
    void refresh();
  }

  function hide() {
    if (!overlay) return;
    stopCountdown();
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
  }

  refreshBtn?.addEventListener("click", () => {
    void refresh();
  });
  closeBtn?.addEventListener("click", hide);
  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) hide();
  });

  return { show, hide, refresh };
}
