// src/pi/piClient.js
import { piLoginAndVerify } from "./piAuth.js";

function hasDevOverride() {
  const params = new URLSearchParams(window.location.search);
  return params.get("dev") === "true";
}

export function setupPiLogin({
  BACKEND,
  loginBtn,
  loginBtnText,
  userPill,
  onLogin,
}) {
  // guard: if UI refs are missing, do nothing instead of crashing
  if (!loginBtn || !loginBtnText || !userPill) return;

  const dev = hasDevOverride();

  async function doLogin() {
    try {
      loginBtn.disabled = true;
      loginBtnText.textContent = "Logging in...";

      // dev mode: allow guest without Pi
      if (dev && !window.Pi) {
        const user = { username: "guest", uid: null };
        userPill.textContent = `User: ${user.username}`;
        loginBtnText.textContent = "Dev mode";
        onLogin?.({ user, accessToken: null });
        return;
      }

      const { user, accessToken } = await piLoginAndVerify({ BACKEND });

      userPill.textContent = `User: ${user.username || "guest"}`;
      loginBtnText.textContent = "Logged in";
      onLogin?.({ user, accessToken });
    } catch (e) {
      console.error(e);
      loginBtnText.textContent = "Login failed";
      alert(String(e?.message || e));
    } finally {
      loginBtn.disabled = false;
    }
  }

  loginBtn.addEventListener("click", doLogin);

  // initial state
  userPill.textContent = "User: guest";
  loginBtnText.textContent = window.Pi ? "Login with Pi" : (dev ? "Dev mode login" : "Login with Pi");
}