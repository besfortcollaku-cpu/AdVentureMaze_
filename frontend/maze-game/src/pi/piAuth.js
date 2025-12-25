// src/pi/piAuth.js

function isDevBypass() {
  const params = new URLSearchParams(window.location.search);
  return params.get("dev") === "true";
}

export async function piLoginAndVerify({ BACKEND }) {
  // Dev bypass: no Pi required, no backend call
  if (isDevBypass()) {
    return {
      user: { username: "guest", uid: null },
      accessToken: null,
    };
  }

  if (!window.Pi) {
    throw new Error("Pi SDK not loaded. Open in Pi Browser or add ?dev=true.");
  }

  // Pi SDK auth
  const auth = await window.Pi.authenticate(["username"], (payment) => {
    // optional payment callbacks (not used now)
    console.log("Pi payment:", payment);
  });

  const accessToken = auth?.accessToken;
  const user = auth?.user || { username: "guest", uid: null };

  if (!BACKEND) throw new Error("BACKEND is missing.");

  // Verify with backend
  const res = await fetch(`${BACKEND}/pi/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Backend verify failed (${res.status}): ${t}`);
  }

  const data = await res.json();

  return {
    user: data?.user || user,
    accessToken,
  };
}