// src/ui/uiWelcome.js
export function mountWelcomeUI(root, user) {
  root.insertAdjacentHTML(
    "beforeend",
    `
    <div class="welcomeOverlay active" id="welcomeOverlay">
      <div class="welcomeCard">
        <img src="/logo.png" class="welcomeLogo" />
        <h1 class="welcomeTitle">
          Welcome${user?.username ? `, ${user.username}` : " back"}
        </h1>
        <p class="welcomeSubtitle">
          Roll through mind-bending mazes.<br/>
          Collect coins. Unlock levels.
        </p>
        <div class="welcomeAction">Tap to Play</div>
      </div>
    </div>
    `
  );

  const overlay = document.getElementById("welcomeOverlay");
  let startHandler = null;

  overlay.addEventListener("pointerdown", () => {
    overlay.remove(); // fully destroy
    startHandler?.();
  });

  return {
    onStart(fn) {
      startHandler = fn;
    },
  };
}