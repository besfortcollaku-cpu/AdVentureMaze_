// src/ui/ui.js (FIXED)

export function mountUI(app) {
  app.innerHTML = `
  <!-- UI HTML UNCHANGED -->
  ${app.innerHTML}
  `;

  /* =========================
     ELEMENTS
  ========================= */

  const coinCountEl = document.getElementById("coinCount");
  const loginBtn = document.getElementById("loginBtn");
  const loginBtnText = document.getElementById("loginBtnText");
  const userPill = document.getElementById("userPill");

  const loginGate = document.getElementById("loginGate");
  const loginGateBtn = document.getElementById("loginGateBtn");
  const loginGateError = document.getElementById("loginGateError");

  /* =========================
     LOGIN GATE STATE
  ========================= */

  let loginGateClickHandler = null;

  function showLoginGate() {
    loginGate?.classList.add("show");
    loginGate?.setAttribute("aria-hidden", "false");
    showLoginError("");
    setGateLoading(false);
  }

  function hideLoginGate() {
    loginGate?.classList.remove("show");
    loginGate?.setAttribute("aria-hidden", "true");
    showLoginError("");
    setGateLoading(false);
  }

  function showLoginError(msg) {
    if (loginGateError) loginGateError.textContent = msg || "";
  }

  function setGateLoading(v) {
    if (!loginGateBtn) return;
    loginGateBtn.disabled = !!v;
    loginGateBtn.textContent = v ? "Logging in..." : "Login with Pi";
  }

  /* =========================
     ✅ FIXED LOGIN HANDLER
  ========================= */

  function onLoginClick(fn) {
    loginGateClickHandler = async () => {
      try {
        setGateLoading(true);

        const result = await fn();

        // 🔑 SAFELY extract username
        const username =
          result?.verifiedUser?.username ||
          result?.auth?.user?.username ||
          result?.user?.username ||
          null;

        if (!username) {
          throw new Error("Login succeeded but username missing");
        }

        setUser({ username });
        hideLoginGate();
      } catch (err) {
        console.error("Login failed:", err);
        showLoginError(err.message || "Login failed");
      } finally {
        setGateLoading(false);
      }
    };
  }

  loginGateBtn?.addEventListener("click", () => {
    loginGateClickHandler?.();
  });

  loginBtn?.addEventListener("click", () => {
    showLoginGate();
    loginGateClickHandler?.();
  });

  /* =========================
     USER UI
  ========================= */

  function setUser(user) {
    const name = user?.username || "guest";
    if (userPill) userPill.textContent = `User: ${name}`;
    if (loginBtnText)
      loginBtnText.textContent =
        name === "guest" ? "Login with Pi" : "Logged in ✅";
  }

  function setCoins(n) {
    if (coinCountEl) coinCountEl.textContent = String(n ?? 0);
  }

  /* =========================
     PUBLIC API
  ========================= */

  return {
    canvas: document.getElementById("game"),

    setCoins,
    setUser,

    showLoginGate,
    hideLoginGate,
    showLoginError,
    onLoginClick,
  };
}