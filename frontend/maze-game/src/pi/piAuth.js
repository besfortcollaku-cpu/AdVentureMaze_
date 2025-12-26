// src/piAuth.js

/**
 * Pi Auth helper:
 * - requires REAL Pi Browser (not just Pi SDK script)
 * - returns { auth, verifiedUser }
 *
 * Backend contract:
 * POST { accessToken } to `${BACKEND}/api/pi/verify`
 * => { ok:true, user: { username, uid } }
 */

// ---------- helpers ----------
function isRealPiBrowserUA() {
  const ua = String(navigator.userAgent || "").toLowerCase();
  return ua.includes("pibrowser"); // most reliable
}

function isDevMode() {
  try {
    const u = new URL(window.location.href);
    const qp = u.searchParams.get("dev");
    if (qp === "true") return true;

    const host = u.hostname || "";
    return (
      host.includes("localhost") ||
      host.includes("127.0.0.1") ||
      host.endsWith("pages.dev")
    );
  } catch {
    return false;
  }
}

function withTimeout(promise, ms, label = "timeout") {
  return Promise.race([
    promise,
    new Promise((_, rej) =>
      setTimeout(() => rej(new Error(`${label} after ${ms}ms`)), ms)
    ),
  ]);
}

// ✅ IMPORTANT: Pi Browser check must NOT be "window.Pi exists"
export function isPiBrowser() {
  return isRealPiBrowserUA();
}

export async function piLoginAndVerify(BACKEND) {
  // 1) Enforce Pi Browser
  if (!isPiBrowser()) {
    throw new Error("Pi Browser required. Open this app inside Pi Browser.");
  }

  // 2) SDK exists?
  if (!window.Pi) {
    throw new Error("Pi SDK not found (window.Pi missing).");
  }

  // 3) Init SDK (sandbox on dev)
  const sandbox = isDevMode();
  try {
    window.Pi.init({ version: "2.0", sandbox });
  } catch {
    // ignore if already initialized
  }

  // 4) Authenticate (add timeout so it can’t hang forever)
  const auth = await withTimeout(
    window.Pi.authenticate(["username"], (payment) => {
      console.log("Incomplete payment found:", payment);
    }),
    20000,
    "Pi.authenticate() did not respond"
  );

  if (!auth?.accessToken) {
    throw new Error("Pi auth did not return accessToken.");
  }

  // 5) Verify token with backend
  const url = `${BACKEND.replace(/\/$/, "")}/api/pi/verify`;

  const res = await withTimeout(
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify({ accessToken: auth.accessToken }),
    }),
    20000,
    "Backend verify request timed out"
  );

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`Backend verify failed (${res.status}): ${text || "no body"}`);
  }

  let data = {};
  try {
    data = JSON.parse(text || "{}");
  } catch {
    // ignore
  }

  return { auth, verifiedUser: data?.user || null };
}