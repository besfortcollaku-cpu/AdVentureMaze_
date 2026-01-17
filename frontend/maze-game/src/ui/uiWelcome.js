// src/ui/uiWelcome.js
export function mountWelcomeUI(root, user) {
  root.insertAdjacentHTML(
    "beforeend",
    `
    <div id="welcomeOverlay" class="overlay active welcome-overlay">
      <div class="welcomeCard">
        <img src="/logo.png" class="welcomeLogo" />
        <h1>Welcome ${user?.username || "Player"}</h1>
        <p>Roll through mind-bending mazes.<br/>Collect coins. Unlock levels.</p>
        <div class="welcomeTap">Tap to Play</div>
      </div>
    </div>
    `
  );

  const overlay = document.getElementById("welcomeOverlay");
  const tapEl = overlay.querySelector(".welcomeTap");

  let startHandler = null;

  // ✅ TAP ANYWHERE (or restrict to tapEl if you prefer)
  overlay.addEventListener("pointerdown", () => {
    startHandler?.();
  });

  return {
    show() {
      overlay.classList.add("active");
    },

    hide() {
      overlay.classList.remove("active");
      overlay.style.pointerEvents = "none";
    },

    onStart(fn) {
      startHandler = fn;
    },
  };
}