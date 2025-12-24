// src/game/game.js
// STEP 7:
// - wires INPUTS (swipe + arrow keys)
// - runs LOOP (updateMovement + renderer.render)
// - supports setLevel(nextLevel)
// - calls onLevelComplete() when all free tiles painted

import { createState } from "./state.js";
import { createRenderer } from "./render.js";
import { requestSlide, updateMovement } from "./movement.js";

export function createGame({ canvas, level, onLevelComplete }) {
  let state = createState(level);
  let renderer = createRenderer({ canvas, state });

  let rafId = null;
  let controller = null;

  // prevent multiple win calls
  let completedFired = false;

  function checkComplete() {
    if (completedFired) return;
    if (state.isComplete()) {
      completedFired = true;
      if (typeof onLevelComplete === "function") {
        onLevelComplete({
          level: state.level,
          painted: state.painted.size,
          total: state.totalFree,
        });
      }
    }
  }

  function bindInputs() {
    controller = new AbortController();
    const sig = controller.signal;

    // Keyboard (desktop testing)
    window.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "ArrowUp") requestSlide(state, 0, -1);
        if (e.key === "ArrowDown") requestSlide(state, 0, 1);
        if (e.key === "ArrowLeft") requestSlide(state, -1, 0);
        if (e.key === "ArrowRight") requestSlide(state, 1, 0);
      },
      { signal: sig }
    );

    // Swipe (mobile)
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
        const t = e.changedTouches[0];
        const dx = t.clientX - sx;
        const dy = t.clientY - sy;

        const ax = Math.abs(dx);
        const ay = Math.abs(dy);

        // ignore tiny swipes
        if (Math.max(ax, ay) < 14) return;

        if (ax > ay) requestSlide(state, dx > 0 ? 1 : -1, 0);
        else requestSlide(state, 0, dy > 0 ? 1 : -1);
      },
      { passive: true, signal: sig }
    );

    // Resize
    window.addEventListener("resize", () => renderer.resize(), { signal: sig });
  }

  function loop(now) {
    updateMovement(state, now);
    renderer.render(state.playerFloat);
    checkComplete();
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (controller) controller.abort();
    controller = null;
  }

  return {
    start() {
      if (!controller) bindInputs();
      renderer.resize();
      completedFired = false;
      if (!rafId) rafId = requestAnimationFrame(loop);
      checkComplete();
    },

    // Next level without reload
    setLevel(nextLevel) {
      stop();
      state = createState(nextLevel);
      renderer = createRenderer({ canvas, state });
      completedFired = false;
      this.start();
    },

    stop,
  };
}