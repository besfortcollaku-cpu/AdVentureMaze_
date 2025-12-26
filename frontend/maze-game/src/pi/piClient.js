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
 * Existing behavior (manual login button).
 * Kept for compatibility.
 */
export function setupPiLogin({
  BACKEND,
  loginBtn,
  loginBtnText,
  userPill,
  onLogin,
}) {
  let CURRENT_USER = { username: "guest", uid: null };
  let CURRENT_ACCESS_TOKEN = null;

  async function doPiLogin() {
    try {
      if (!loginBtn) return;

      loginBtn.disabled = true;
      if (loginBtnText) loginBtnText.textContent = "Logging in...";

      const { auth, verifiedUser } = await piLoginAndVerify(BACKEND);

      CURRENT_ACCESS_TOKEN = auth?.accessToken || null;

      const username =
        verifiedUser?.username || auth?.user?.username || "unknown";
      const uid = verifiedUser?.uid || auth?.user?.uid || null;

      CURRENT_USER = { username, uid };

      if (userPill) userPill.textContent = `User: ${CURRENT_USER.username}`;
      if (loginBtnText) loginBtnText.textContent = "Logged in ✅";

      // ✅ persist
      if (CURRENT_ACCESS_TOKEN) {
        saveSession({
          user: CURRENT_USER,
          accessToken: CURRENT_ACCESS_TOKEN,
        });
      }

      onLogin?.({ user: CURRENT_USER, accessToken: CURRENT_ACCESS_TOKEN });
    } catch (e) {
      alert("Pi Login failed: " + (e?.message || String(e)));
      if (loginBtnText) loginBtnText.textContent = "Login with Pi";
    } finally {
      if (loginBtn) loginBtn.disabled = false;
    }
  }

  if (loginBtn) loginBtn.addEventListener("click", doPiLogin);

  return {
    doPiLogin,
    getUser: () => CURRENT_USER,
    getToken: () => CURRENT_ACCESS_TOKEN,
  };
}

/**
 * ✅ Mandatory login gate
 * Behavior:
 * 1) restore session from localStorage (fast)
 * 2) else show fullscreen gate and WAIT until login succeeds
 *
 * UI expected:
 * - ui.showLoginGate()
 * - ui.hideLoginGate()
 * - ui.showLoginError(msg)
 * - ui.setUser(user)
 * - ui.onLoginClick(fn)  // should trigger on BOTH top login and gate login
 *
 * This function will NOT return ok=false on failure anymore.
 * It keeps waiting until the user successfully logs in.
 */
export async function ensurePiLogin({ BACKEND, ui, onLogin }) {
  // ---------------------------
  // Helpers: button state + labels
  // ---------------------------
  const gateBtn = () => document.getElementById("gateLoginBtn");
  const topBtn = ui?.loginBtn || null;
  const topText = ui?.loginBtnText || null;

  function setBusy(busy) {
    try {
      if (topBtn) topBtn.disabled = !!busy;
      const gb = gateBtn();
      if (gb) gb.disabled = !!busy;
    } catch {}
  }

  function setTopText(t) {
    try {
      if (topText) topText.textContent = t;
    } catch {}
  }

  function setGateText(t) {
    try {
      const gb = gateBtn();
      if (gb) gb.textContent = t;
    } catch {}
  }

  // ---------------------------
  // 1) Try restore
  // ---------------------------
  const saved = loadSession();
  if (saved?.accessToken && saved?.user) {
    onLogin?.({ user: saved.user, accessToken: saved.accessToken });
    ui?.setUser?.(saved.user);
    ui?.hideLoginGate?.();
    setTopText("Logged in ✅");
    return { ok: true, restored: true };
  }

  // ---------------------------
  // 2) Force login gate
  // ---------------------------
  ui?.showLoginGate?.();
  ui?.showLoginError?.(""); // clear
  setGateText("Login with Pi");
  setTopText("Login with Pi");

  // If UI doesn't support click handler, fallback: keep trying once
  if (!ui?.onLoginClick) {
    // Try once and throw if fail (so you see the error)
    const { auth, verifiedUser } = await piLoginAndVerify(BACKEND);
    const accessToken = auth?.accessToken || null;
    const username = verifiedUser?.username || auth?.user?.username || "unknown";
    const uid = verifiedUser?.uid || auth?.user?.uid || null;
    const user = { username, uid };

    if (!accessToken) throw new Error("Missing accessToken");

    saveSession({ user, accessToken });
    onLogin?.({ user, accessToken });
    ui?.setUser?.(user);
    ui?.hideLoginGate?.();
    setTopText("Logged in ✅");
    return { ok: true, restored: false };
  }

  // ---------------------------
  // 3) Wait until user login succeeds
  // ---------------------------
  return await new Promise((resolve) => {
    let inProgress = false;

    const runLogin = async () => {
      if (inProgress) return;
      inProgress = true;

      try {
        ui?.showLoginError?.(""); // clear
        setBusy(true);
        setGateText("Logging in...");
        setTopText("Logging in...");

        const { auth, verifiedUser } = await piLoginAndVerify(BACKEND);

        const accessToken = auth?.accessToken || null;
        const username =
          verifiedUser?.username || auth?.user?.username || "unknown";
        const uid = verifiedUser?.uid || auth?.user?.uid || null;

        const user = { username, uid };

        if (!accessToken) throw new Error("Missing accessToken");

        saveSession({ user, accessToken });

        onLogin?.({ user, accessToken });
        ui?.setUser?.(user);
        ui?.hideLoginGate?.();

        setTopText("Logged in ✅");
        setGateText("Logged in ✅");

        resolve({ ok: true, restored: false });
      } catch (e) {
        // ✅ IMPORTANT: DO NOT resolve here — keep waiting for another click
        ui?.showLoginError?.(
          "Login failed. Please try again.\n\n" +
            (e?.message || String(e))
        );
        setGateText("Retry login");
        setTopText("Login with Pi");
      } finally {
        setBusy(false);
        inProgress = false;
      }
    };

    // Wire the handler: (your ui.js triggers this from BOTH buttons)
    ui.onLoginClick(runLogin);

    // Optional: try auto immediately (sometimes Pi allows it)
    // If it fails, user can tap retry.
    runLogin();
  });
}