import "../css/levels.css";

export function mountLevelsUI(root) {
  // =========================
  // CREATE DOM
  // =========================
  const overlay = document.createElement("div");
  overlay.className = "popupOverlay hidden";

  const card = document.createElement("div");
  card.className = "popupCard popup-animate";

  overlay.appendChild(card);
  root.appendChild(overlay);

  card.innerHTML = `
    <div class="popupHeader">
      <span class="popupBadge">LEVELS</span>
      <h2>Select Level</h2>
    </div>

    <div class="levelsGrid"></div>

    <button class="popupBtn secondary closeBtn">Close</button>
  `;

  const grid = card.querySelector(".levelsGrid");
  const closeBtn = card.querySelector(".closeBtn");

  let unlockedLevel = 1;
  let lastUnlockedLevel = 1;
  let onSelectCb = () => {};

  // =========================
  // BUILD LEVEL BUTTONS
  // =========================
  function render({ animateUnlock = false } = {}) {
    grid.innerHTML = "";

    for (let i = 1; i <= 50; i++) {
      const btn = document.createElement("button");
      btn.className = "levelItem";
      btn.dataset.level = String(i);

      // -------- STATES --------
      if (i < unlockedLevel) {
        btn.classList.add("completed");
        btn.innerHTML = `<span class="icon">✔</span><span>Level ${i}</span>`;
      } 
      else if (i === unlockedLevel) {
        btn.classList.add("unlocked");
        btn.innerHTML = `<span>Level ${i}</span>`;

        // 🔥 UNLOCK ANIMATION (only when advancing)
        if (animateUnlock && unlockedLevel > lastUnlockedLevel) {
          btn.classList.add("justUnlocked");;

          // auto scroll into view
          setTimeout(() => {
            btn.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 100);
        }
      } 
      else {
        btn.classList.add("locked");
        btn.innerHTML = `<span class="icon">🔒</span><span>Level ${i}</span>`;
      }

      // -------- CLICK --------
      btn.addEventListener("click", () => {
        if (i > unlockedLevel) {
          window.__maze?.showLoginRequired?.();
          return;
        }
        hide();
        onSelectCb(i);
      });

      grid.appendChild(btn);
    }

    lastUnlockedLevel = unlockedLevel;
  }

  // =========================
  // OPEN / CLOSE
  // =========================
  function open() {
    render();
    overlay.classList.remove("hidden");
    requestAnimationFrame(() => {
      card.classList.add("show");
    });
  }

  function hide() {
    card.classList.remove("show");
    setTimeout(() => {
      overlay.classList.add("hidden");
    }, 200);
  }

  closeBtn.addEventListener("click", hide);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) hide();
  });

  // =========================
  // PUBLIC API
  // =========================
  return {
    open,
    close: hide,

    /**
     * Call this when progress changes
     * Example: setUnlocked(6)
     */
    setUnlocked(n) {
      const next = Math.max(1, Number(n) || 1);
      const animate = next > unlockedLevel;
      unlockedLevel = next;

      render({ animateUnlock: animate });
    },

    onSelect(cb) {
      onSelectCb = cb;
    },
  };
}