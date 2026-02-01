// src/pi/piClient.js
import { loadSession, saveSession, clearPiSession } from "./piSession.js";
import { verifySessionWithBackend } from "./piVerify.js";
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
  // prevent double-run
  if (ensurePiLogin._running) {
    return { ok: false };
  }
  ensurePiLogin._running = true;

  try {
    // -----------------------------
    // 1️⃣ Try restore saved session
    // -----------------------------
    const saved = loadSession();

    if (saved?.accessToken) {
      const check = await verifySessionWithBackend(
        BACKEND,
        saved.accessToken
      );

      if (check.ok && check.data?.user) {
        const user = check.data.user;

        // 🔥 CRITICAL: propagate user + token
        onLogin?.({
          user,
          accessToken: saved.accessToken,
        });

        ui?.setUser?.(user);
        ui?.hideLoginGate?.();

        return {
          ok: true,
          restored: true,
          accessToken: saved.accessToken,
        };
      }

      // invalid session → clear
      clearPiSession();
    }

    // -----------------------------
    // 2️⃣ Force Pi login (popup)
    // -----------------------------
    ui?.showLoginGate?.();

    const auth = await piLoginAndVerify(BACKEND);

    if (!auth?.accessToken || !auth?.user) {
      ui?.showLoginError?.("Login failed");
      return { ok: false };
    }

    // save session
    saveSession({
      accessToken: auth.accessToken,
    });

    // 🔥 CRITICAL: propagate user + token
    onLogin?.({
      user: auth.user,
      accessToken: auth.accessToken,
    });

    ui?.setUser?.(auth.user);
    ui?.hideLoginGate?.();

    return {
      ok: true,
      accessToken: auth.accessToken,
    };
  } finally {
    ensurePiLogin._running = false;
  }
}