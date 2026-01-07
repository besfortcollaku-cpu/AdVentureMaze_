// src/pi/piClient.js

const STORAGE_KEY = "pi_session_v1";

/**
 * Ensure Pi login.
 * - Restores session from localStorage
 * - Handles UI login gate
 * - Calls backend /api/pi/verify
 */
export async function ensurePiLogin({ BACKEND, ui, onLogin }) {
  // ---------------------------
  // Restore previous session
  // ---------------------------
  const saved = loadSession();
  if (saved?.accessToken && saved?.user) {
    onLogin({
      user: saved.user,
      accessToken: saved.accessToken,
    });
    ui.hideLoginGate();
    return { ok: true, restored: true };
  }

  // ---------------------------
  // Register UI login click
  // ---------------------------
  ui.onLoginClick(async () => {
    try {
      ui.showLoginError("");
      await loginFlow({ BACKEND, ui, onLogin });
    } catch (e) {
      console.error("Pi login failed:", e);
      ui.showLoginError(e.message || "Login failed");
    }
  });

  // Show gate immediately
  ui.showLoginGate();

  return { ok: false, restored: false };
}

// ---------------------------
// Core login flow
// ---------------------------
async function loginFlow({ BACKEND, ui, onLogin }) {
  if (!window.Pi) {
    throw new Error("Pi SDK not available. Open in Pi Browser.");
  }

  // Ask Pi for auth
  const auth = await window.Pi.authenticate(
    ["username", "payments"],
    "AdventureMaze Login"
  );

  if (!auth?.accessToken) {
    throw new Error("Pi authentication failed");
  }

  // Verify token with backend
  const res = await fetch(`${BACKEND}/api/pi/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accessToken: auth.accessToken,
    }),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid server response");
  }

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || "Server verification failed");
  }

  const { user, accessToken } = data;

  // Persist session
  saveSession({ user, accessToken });

  // Update app
  onLogin({ user, accessToken });
  ui.setUser(user);
  ui.hideLoginGate();

  return { ok: true };
}

// ---------------------------
// Persistence helpers
// ---------------------------
function saveSession(session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {}
}

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Optional helper if you ever want logout later
 */
export function clearPiSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}