import "../css/leaderboardMonthly.css";

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

export function mountLeaderboardMonthlyUI(root) {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="leaderboardMonthlyOverlay" id="leaderboardMonthlyOverlay" aria-hidden="true">
      <div class="leaderboardMonthlyCard">
        <div class="leaderboardMonthlyTopBar">
          <div>
            <div class="leaderboardMonthlyTitle">Leaderboard</div>
            <div class="leaderboardMonthlySeason" id="leaderboardMonthlySeason">Season: --</div>
          </div>
          <button class="leaderboardMonthlyClose" id="leaderboardMonthlyClose" type="button">X</button>
        </div>

        <div class="leaderboardMonthlyScroll">
          <div class="leaderboardMonthlyContent">
            <div class="leaderboardMonthlySection">
              <div class="leaderboardMonthlySectionTitle">Your Summary</div>
              <div class="leaderboardMonthlyStatus" id="leaderboardMonthlySummaryStatus">Loading...</div>
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
              <div class="leaderboardMonthlyTierGrid" id="leaderboardMonthlyTierGrid"></div>
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
  const summaryStatusEl = root.querySelector("#leaderboardMonthlySummaryStatus");
  const summaryCardEl = root.querySelector("#leaderboardMonthlySummaryCard");
  const seasonStatusEl = root.querySelector("#leaderboardMonthlySeasonStatus");
  const tierGridEl = root.querySelector("#leaderboardMonthlyTierGrid");
  const listStatusEl = root.querySelector("#leaderboardMonthlyListStatus");
  const rowsEl = root.querySelector("#leaderboardMonthlyRows");

  function renderSummary(summary) {
    if (!summaryCardEl) return;

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
  }

  function renderSeasonRewards(summary, listOut) {
    if (seasonStatusEl) {
      seasonStatusEl.textContent = renderProjectedStatus(summary || {});
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

  function renderItems(items, meUid) {
    if (!rowsEl) return;
    const list = Array.isArray(items) ? items : [];
    if (!list.length) {
      rowsEl.innerHTML = `<div class="leaderboardMonthlyRow is-empty">No leaderboard data yet.</div>`;
      return;
    }

    rowsEl.innerHTML = list
      .map((item) => {
        const uid = String(item?.uid || "player");
        const isMe = meUid && uid === meUid;
        const tierLabel = String(item?.projectedTierLabel || item?.projectedTierName || "-");
        return `
          <div class="leaderboardMonthlyRow${isMe ? " is-me" : ""}">
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
        seasonEl.textContent = monthKey ? `Season: ${formatMonthKey(monthKey)}` : "Season: --";
      }

      renderSummary(meOut || {});
      renderSeasonRewards(meOut || {}, listOut || {});
      renderItems(listOut?.items || [], meOut?.uid || "");

      if (summaryStatusEl) summaryStatusEl.textContent = "";
      if (listStatusEl) listStatusEl.textContent = (listOut?.items || []).length ? "" : "No leaderboard data yet";
    } catch {
      if (summaryStatusEl) summaryStatusEl.textContent = "Failed to load leaderboard";
      if (listStatusEl) listStatusEl.textContent = "Failed to load leaderboard";
      if (seasonStatusEl) seasonStatusEl.textContent = "";
      if (tierGridEl) tierGridEl.innerHTML = "";
      if (rowsEl) rowsEl.innerHTML = "";
      if (summaryCardEl) summaryCardEl.innerHTML = "";
    }
  }

  function show() {
    if (!overlay) return;
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
    void refresh();
  }

  function hide() {
    if (!overlay) return;
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
