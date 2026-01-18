// src/game/game.js
import { createGameState } from "./state.js";
import { createMovement } from "./movement.js";
import { createRenderer } from "./render.js";

export function createGame({ canvas, level, onLevelComplete }) {
  let state = createGameState(level);
  let renderer = createRenderer({ canvas, state });

  let completed = false;

  let movement = createMovement({
    state,
    onMoveFinished: () => {
      if (!completed && state.isComplete()) {
        completed = true;
        onLevelComplete?.({ level: state.level, state });
      }
    },
  });

  // ---------------------------
  // Movement API
  // ---------------------------
  function requestMove(dx, dy) {
    if (completed) return;
    movement.startMove(dx, dy);
  }

  // ---------------------------
  // Input (bind ONCE)
  // ---------------------------
  let controller = null;

  function bindInputsOnce() {
    if (controller) return;
    controller = new AbortController();
    const sig = controller.signal;

    // keyboard (desktop testing)
    window.addEventListener(
      "keydown",
      (e) => {
        if (completed) return;
        if (e.key === "ArrowUp") requestMove(0, -1);
        if (e.key === "ArrowDown") requestMove(0, 1);
        if (e.key === "ArrowLeft") requestMove(-1, 0);
        if (e.key === "ArrowRight") requestMove(1, 0);
      },
      { signal: sig }
    );

    // swipe
    let sx = 0;
    let sy = 0;

    canvas.addEventListener(
      "touchstart",
      (e) => {
        const t = e.touches[0];
        sx = t.clientX;
        sy = t.clientY;
      },
      { passive: true, signal: sig }
    );

    canvas.addEventListener(
      "touchend",
      (e) => {
        if (completed) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - sx;
        const dy = t.clientY - sy;

        const ax = Math.abs(dx);
        const ay = Math.abs(dy);
        if (Math.max(ax, ay) < 14) return;

        if (ax > ay) requestMove(dx > 0 ? 1 : -1, 0);
        else requestMove(0, dy > 0 ? 1 : -1);
      },
      { passive: true, signal: sig }
    );

    window.addEventListener("resize", () => renderer.resize(), { signal: sig });
  }

  // ---------------------------
  // Game loop
  // ---------------------------
  let rafId = null;

  function loop(now) {
    movement.update(now);
    const p = movement.getAnimatedPlayer(now);
    renderer.render(p);
    rafId = requestAnimationFrame(loop);
  }

  function startLoop() {
    if (rafId) return;
    renderer.resize();
    rafId = requestAnimationFrame(loop);
  }

  // ---------------------------
  // ✅ LEVEL SWITCHING (KEY PART)
  // ---------------------------
  function loadLevel(nextLevel) {
    completed = false;

    // rebuild state
    state = createGameState(nextLevel);

    // rebuild renderer & movement with SAME canvas
    renderer = createRenderer({ canvas, state });

    movement = createMovement({
      state,
      onMoveFinished: () => {
        if (!completed && state.isComplete()) {
          completed = true;
          onLevelComplete?.({ level: state.level, state });
        }
      },
    });

    // draw first frame immediately
    renderer.resize();
    const p = movement.getAnimatedPlayer(performance.now());
    renderer.render(p);
  }

  // ---------------------------
  // Public API
  // ---------------------------
  return {
    start() {
      bindInputsOnce();
      startLoop();
    },

    loadLevel, // 👈 what main.js uses

    destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      if (controller) controller.abort();
      controller = null;
    },

    getState() {
      return state;
    },
  };
}