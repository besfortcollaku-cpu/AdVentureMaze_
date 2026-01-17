// src/ui/uiWelcome.js

export function mountWelcomeUI(app) {
  // ---------------------------
  // HTML
  // ---------------------------
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div class="welcomeOverlay show" id="welcomeOverlay">
      <div class="welcomeCard">
        <img src="/logo.png" class="welcomeLogo" alt="Adventure Maze" />

        <h1 class="welcomeTitle">Adventure Maze</h1>

        <p class="welcomeText">
          Roll through mind-bending mazes.<br>
          Collect coins. Unlock levels.
        </p>

        <button class="welcomeBtn hidden" id="startAdventureBtn">
          Tap anywhere to start
        </button>
      </div>
    </div>
  `;

  app.appendChild(wrapper);

  // ---------------------------
  // Elements
  // ---------------------------
  const welcomeOverlay = wrapper.querySelector("#welcomeOverlay");
  const startBtn = wrapper.querySelector("#startAdventureBtn");

  let startHandler = null;

  // show button after delay (UX polish)
  setTimeout(() => {
    startBtn?.classList.remove("hidden");
  }, 5000);

  // tap anywhere
  welcomeOverlay.addEventListener("pointerdown", () => {
    hide();
    startHandler?.();
  });

  // explicit button tap
  startBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    hide();
    startHandler?.();
  });

  function hide() {
    welcomeOverlay.classList.add("fadeOut");
    setTimeout(() => {
      wrapper.remove();
    }, 400);
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