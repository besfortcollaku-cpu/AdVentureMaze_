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

  return await new Promise((resolve) => {
    const hasGate = typeof ui?.onLoginClick === "function";

    const runLogin = async () => {
      if (isLoggingIn) return; // block double clicks
      isLoggingIn = true;

      try {
        ui?.showLoginError?.("");

        // Pi login + backend verify (creates user in DB via /api/pi/verify inside your piAuth)
        const { auth } = await piLoginAndVerify(BACKEND);

        const accessToken = auth?.accessToken || null;
        if (!accessToken) throw new Error("Missing accessToken");

        // ✅ confirm backend accepts token and returns /api/me
        const check = await verifySessionWithBackend(BACKEND, accessToken);
        if (!check.ok) throw new Error(check.error || "Session verify failed");

        // persist
        saveSession({ user: check.data.user, accessToken });

        onLogin?.({ user: check.data.user, accessToken });
        ui?.setUser?.(check.data.user);
        ui?.hideLoginGate?.();

        resolve({ ok: true, restored: false });
      } catch (e) {
        // ✅ IMPORTANT CHANGE: show the REAL error (no generic message)
        const msg = String(e?.message || e || "Login failed");
        ui?.showLoginError?.(msg);
        resolve({ ok: false, error: msg });
      } finally {
        isLoggingIn = false;
      }
    };

    // fallback: no UI gate implemented -> try immediately
    if (!hasGate) {
      runLogin();
      return;
    }

    // gate button click triggers login (single handler)
    ui.onLoginClick(runLogin);
  });
}