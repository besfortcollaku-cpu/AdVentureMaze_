const BASE_URL = ""; 
// empty = same origin
// if backend is elsewhere, put full URL here

async function request(path, options = {}) {
  const res = await fetch(BASE_URL + path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "API error");
  }

  return res.json();
}

/* ================= USER ================= */

export function apiMe() {
  return request("/api/me");
}

export function getLeaderboard(params = {}) {
  const qs = new URLSearchParams();
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return request(`/api/leaderboard${suffix}`);
}

export function getMyLeaderboardSummary() {
  return request("/api/leaderboard/me");
}

/* ================= SKIP ================= */

export function apiSkip(mode, nonce) {
  return request("/api/skip", {
    method: "POST",
    body: JSON.stringify({ mode, nonce })
  });
}

/* ================= HINT ================= */

export function apiHint(mode, nonce) {
  return request("/api/hint", {
    method: "POST",
    body: JSON.stringify({ mode, nonce })
  });
}
/* ================= INVITES ================= */

export function apiInviteMe() {
  return request("/api/invite/me");
}

export function apiInviteClaim(code) {
  return request("/api/invite/claim", {
    method: "POST",
    body: JSON.stringify({ code })
  });
}
