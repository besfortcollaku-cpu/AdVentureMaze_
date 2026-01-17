// src/ui/uiWelcome.js

export function mountWelcomeUI(app, { username = "Player", isNewUser = true } = {}) {
  // ---------------------------
  // HTML
  // ---------------------------
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div class="welcomeOverlay active" id="welcomeOverlay">
      <div class="welcomeCard">
        <img src="/logo.png" class="welcomeLogo" alt="Adventure Maze" />

        <h2 class="welcomeTitle">
          ${isNewUser ? "Welcome" : "Welcome back"}, ${username}
        </h2>

        <p class="welcomeText">
          Roll through mind-bending mazes.<br/>
          Collect coins. Unlock levels.
        </p>

        <div class="welcomeHint">
          Tap anywhere to start
        </div>
      </div>
    </div>
  `;

  app.appendChild(wrapper);

  // ---------------------------
  // Elements
  // ---------------------------
  const overlay = wrapper.querySelector("#welcomeOverlay");

  let startHandler = null;
  let isClosed = false;

  // ---------------------------
  // Events
  // ---------------------------
  overlay.addEventListener("pointerdown", () => {
    if (isClosed) return;
    isClosed = true;
    hide();
    startHandler?.();
  });

  // ---------------------------
  // Helpers
  // ---------------------------
  function hide() {
    overlay.classList.remove("active");
    overlay.classList.add("fadeOut");

    setTimeout(() => {
      wrapper.remove();
    }, 350);
  }

  return {
    onStart(fn) {
      startHandler = fn;
    },
    destroy() {
      wrapper.remove();
    },
  };
}