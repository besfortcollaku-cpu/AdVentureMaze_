import { loadSession, saveSession, clearPiSession } from "./piSession.js";
import { verifySessionWithBackend } from "./piVerify.js";
import { piLoginAndVerify } from "./piAuth.js";

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