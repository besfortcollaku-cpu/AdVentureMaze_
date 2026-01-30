// src/pi/piClient.js
import { piLoginAndVerify } from "./piAuth.js";

/**
 * Session persistence
 * We store: { user: {username, uid}, accessToken }
 */
const SESSION_KEY = "pi_session_v1";

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSession(session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {}
}

export function clearPiSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}

/**
 * Verify token by calling backend /api/me.
 * If it fails, token is not usable anymore.
 */
async function verifySessionWithBackend(BACKEND, accessToken) {
  const base = BACKEND.replace(/\/$/, "");
  const res = await fetch(`${base}/api/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    return { ok: false, error: data?.error || "invalid session" };
  }

  // expected: { ok:true, user, progress }
  return { ok: true, data };
}


export async function ensurePiLogin({ BACKEND, ui, onLogin }) {
  // prevent double-run / double-click
  let isLoggingIn = false;

  // 1) Try restore
  const saved = loadSession();
  if (saved?.accessToken) {
    const check = await verifySessionWithBackend(BACKEND, saved.accessToken);

    if (check.ok) {
      // ✅ session is valid
      onLogin?.({ user: check.data.user, accessToken: saved.accessToken });
      ui?.setUser?.(check.data.user);
      ui?.hideLoginGate?.();
      return { ok: true, restored: true };
    }

    // ❌ session invalid -> clear and continue to login
    clearPiSession();
    ui?.showLoginError?.("Session expired. Please login again.");
  }

  // 2) Force login before game start
  ui?.showLoginGate?.();

  // no valid session → caller must trigger login
return { ok: false, needsLogin: true };
}