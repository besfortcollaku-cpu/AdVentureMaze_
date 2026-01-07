/**
 * Pi Auth helper
 * - Requires Pi Browser
 * - Supports sandbox (pages.dev or ?dev=true)
 * - Verifies token with backend
 */

export function isPiBrowser() {
  const ua = (navigator.userAgent || "").toLowerCase();
  return ua.includes("pibrowser");
}

function isDevSandbox() {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("dev") === "true") return true;
    if (window.location.hostname.includes("pages.dev")) return true;
    return false;
  } catch {
    return false;
  }
}

export async function piLoginAndVerify(BACKEND) {
  // 🔹 Do NOT hard-block here — Pi Browser injects Pi dynamically
  if (typeof window === "undefined") {
    throw new Error("Not running in browser");
  }

  if (!window.Pi) {
    throw new Error("Pi SDK not loaded (are you in Pi Browser?)");
  }

  const sandbox = isDevSandbox();

  // ✅ CORRECT INIT (THIS WAS THE MAIN BUG)
  try {
    window.Pi.init({
      version: "2", // ✅ MUST be "2"
      sandbox,
    });
  } catch (e) {
    // already initialized — safe to ignore
  }

  // ✅ AUTHENTICATE (must be user-triggered)
  const auth = await window.Pi.authenticate(
    ["username"],
    () => {
      // required callback (can be empty)
      return;
    }
  );

  if (!auth || !auth.accessToken) {
    throw new Error("Pi did not return accessToken");
  }

  // ✅ BACKEND VERIFY
  const base = BACKEND.replace(/\/$/, "");
  const res = await fetch(`${base}/api/pi/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.accessToken}`,
    },
    body: JSON.stringify({
      accessToken: auth.accessToken,
    }),
  });

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {}

  if (!res.ok || !data?.ok) {
    throw new Error(
      data?.error || `Backend verify failed (${res.status})`
    );
  }

  return {
    auth,
    verifiedUser: data.user,
  };
}