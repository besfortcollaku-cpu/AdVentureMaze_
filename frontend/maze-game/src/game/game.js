// src/game/game.js



import { createGameState } from "./state.js";

import { createMovement } from "./movement.js";

import { createRenderer } from "./render.js";



export function createGame({ canvas, level, onLevelComplete }) {

  const state = createGameState(level);

  const renderer = createRenderer({ canvas, state });



  let completed = false;



  const movement = createMovement({

    state,

    onMoveFinished: () => {

      if (!completed && state.isComplete()) {

        completed = true;

        onLevelComplete?.();

      }

    },

  });



  function requestMove(dx, dy) {

    if (completed) return;

    movement.startMove(dx, dy);

  }



  // desktop keys (testing)

  function onKeyDown(e) {

    if (completed) return;

    if (e.key === "ArrowUp") requestMove(0, -1);

    if (e.key === "ArrowDown") requestMove(0, 1);

    if (e.key === "ArrowLeft") requestMove(-1, 0);

    if (e.key === "ArrowRight") requestMove(1, 0);

  }



  // swipe controls

  let touchStartX = 0;

  let touchStartY = 0;



  function onTouchStart(e) {

    const t = e.touches[0];

    touchStartX = t.clientX;

    touchStartY = t.clientY;

  }



  function onTouchEnd(e) {

    if (completed) return;

    const t = e.changedTouches[0];

    const dx = t.clientX - touchStartX;

    const dy = t.clientY - touchStartY;



    const ax = Math.abs(dx);

    const ay = Math.abs(dy);

    if (Math.max(ax, ay) < 14) return;



    if (ax > ay) requestMove(dx > 0 ? 1 : -1, 0);

    else requestMove(0, dy > 0 ? 1 : -1);

  }



  function loop(now) {

    movement.update(now);

    const p = movement.getAnimatedPlayer(now);

    renderer.render(p);

    requestAnimationFrame(loop);

  }



  return {

    start() {

      renderer.resize();

      window.addEventListener("resize", renderer.resize);



      window.addEventListener("keydown", onKeyDown);

      canvas.addEventListener("touchstart", onTouchStart, { passive: true });

      canvas.addEventListener("touchend", onTouchEnd, { passive: true });



      requestAnimationFrame(loop);

    },

  };

}