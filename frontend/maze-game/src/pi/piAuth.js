// src/pi/piAuth.js

/**
 * Does Pi auth + backend verify
 * Returns: { user, accessToken }
 */
export async function piLoginAndVerify({ BACKEND }) {
  if (!window.Pi) throw new Error("Pi SDK not available");

  // init once
  if (!window.__PI_INIT_DONE__) {
    window.Pi.init({ version: "2.0", sandbox: false });
    window.__PI_INIT_DONE__ = true;
  }

  // 1) Pi auth
  const auth = await window.Pi.authenticate(["username"], () => {
    // onIncompletePaymentFound - not used here
  });

  // 2) Verify with backend
  const res = await fetch(`${BACKEND}/pi/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(auth),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Backend verify failed (${res.status}): ${msg}`);
  }

  const data = await res.json();

  // expect backend returns { user, accessToken } (or similar)
  return {
    user: data.user || { username: auth?.user?.username || "guest", uid: null },
    accessToken: data.accessToken || null,
  };
}