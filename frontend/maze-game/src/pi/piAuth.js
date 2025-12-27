// src/pi/piAuth.js

/**
 * Pi Auth helper:
 * - requires Pi Browser (Pi SDK available)
 * - returns { auth, verifiedUser }
 *
 * Backend contract:
 * POST { accessToken } to `${BACKEND}/api/pi/verify`
 * => { ok:true, user:{ username, uid } }
 */

export function isPiBrowser() {
  // Most reliable: Pi SDK object exists
  if (typeof window !== "undefined" && window.Pi) return true;

  // Fallback: UA contains PiBrowser (not always)
  const ua = (navigator.userAgent || "").toLowerCase();
  if (ua.includes("pibrowser")) return true;

  return false;
}

function isDevSandbox() {
  try {
    const url = new URL(window.location.href);
    const dev = url.searchParams.get("dev");
    if (String(dev).toLowerCase() === "true") return true;

    // optional: treat pages.dev as sandbox by default
    if (window.location.hostname.includes("pages.dev")) return true;

    return false;
  } catch {
    return false;
  }
}

function withTimeout(promise, ms, label = "timeout") {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} after ${ms}ms`)), ms)
    ),
  ]);
}

export async function piLoginAndVerify(BACKEND) {
  if (!isPiBrowser()) {
    throw new Error("Pi Browser required (open this inside Pi Browser).");
  }

  if (!window.Pi) {
    throw new Error("Pi SDK not found. Check index.html script src.");
  }

  const sandbox = isDevSandbox();

  // ✅ IMPORTANT: init with sandbox when testing
  try {
    window.Pi.init({ version: "2.0", sandbox });
  } catch {
    // ignore if already initialized
  }

  // ✅ If Pi SDK hangs, you’ll now get a clear timeout error
  const auth = await withTimeout(
    window.Pi.authenticate(["username"], (payment) => {
      console.log("Incomplete payment found:", payment);
    }),
    20000,
    "Pi.authenticate()"
  );

  if (!auth?.accessToken) {
    throw new Error("Pi auth did not return accessToken.");
  }

  // Verify token with backend
  const res = await withTimeout(
    fetch(`${BACKEND.replace(/\/$/, "")}/api/pi/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify({ accessToken: auth.accessToken }),
    }),
    20000,
    "Backend /api/pi/verify"
  );

  const text = await res.text().catch(() => "");
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!res.ok || !data?.ok) {
    throw new Error(
      data?.error || `Backend verify failed (${res.status}): ${text}`
    );
  }

  return { auth, verifiedUser: data?.user || null };
}