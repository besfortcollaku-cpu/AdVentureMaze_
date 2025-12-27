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
  // Most reliable: Pi SDK injected
  if (typeof window !== "undefined" && window.Pi) return true;

  // Fallback: user agent check
  const ua = (navigator.userAgent || "").toLowerCase();
  if (ua.includes("pibrowser")) return true;

  return false;
}

/**
 * Detect Pi sandbox mode
 * - ?dev=true
 * - *.pages.dev
 */
function isDevSandbox() {
  try {
    const url = new URL(window.location.href);

    const dev = url.searchParams.get("dev");
    if (String(dev).toLowerCase() === "true") return true;

    // Treat Cloudflare Pages as sandbox by default
    if (window.location.hostname.includes("pages.dev")) return true;

    return false;
  } catch {
    return false;
  }
}

export async function piLoginAndVerify(BACKEND) {
  if (!isPiBrowser()) {
    throw new Error("Pi Browser required (open this inside Pi Browser).");
  }

  if (!window.Pi) {
    throw new Error("Pi SDK not found. Make sure you are inside Pi Browser.");
  }

  const sandbox = isDevSandbox();
  console.log("[PiAuth] sandbox =", sandbox);

  // ✅ IMPORTANT: init Pi SDK with sandbox flag
  try {
    window.Pi.init({
      version: "2.0",
      sandbox,
    });
  } catch {
    // ignore if already initialized
  }

  // Authenticate user
  const auth = await window.Pi.authenticate(
    ["username"],
    (payment) => {
      console.log("Incomplete payment found:", payment);
    }
  );

  if (!auth?.accessToken) {
    throw new Error("Pi auth did not return accessToken.");
  }

  // 🔐 Verify token with backend
  const res = await fetch(`${BACKEND.replace(/\/$/, "")}/api/pi/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.accessToken}`,
    },
    body: JSON.stringify({ accessToken: auth.accessToken }),
  });

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

  return {
    auth,
    verifiedUser: data.user || null,
  };
}