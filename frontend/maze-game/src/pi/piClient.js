// src/pi/piClient.js
import { piLoginAndVerify } from "./piAuth.js";

export function setupPiLogin({
  BACKEND,
  loginBtn,
  loginBtnText,
  userPill,
  onLogin,
}) {
  async function doPiLogin() {
    if (!loginBtn) return;

    try {
      loginBtn.disabled = true;
      if (loginBtnText) loginBtnText.textContent = "Logging in...";

      const { user, accessToken } = await piLoginAndVerify({ BACKEND });

      if (userPill) userPill.textContent = `User: ${user.username || "guest"}`;
      if (typeof onLogin === "function") onLogin({ user, accessToken });
    } catch (err) {
      console.error("Pi login failed:", err);
      alert(String(err?.message || err));

      if (userPill) userPill.textContent = "User: guest";
    } finally {
      if (loginBtnText) loginBtnText.textContent = "Login with Pi";
      loginBtn.disabled = false;
    }
  }

  if (loginBtn) loginBtn.addEventListener("click", doPiLogin);
}