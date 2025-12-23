// src/game/game.js



import { createGameState } from "./state.js";

import { createMovement } from "./movement.js";

import { createRenderer } from "./render.js";



export function createGame({ canvas, level }) {

  const state = createGameState(level);



  const renderer = createRenderer({ canvas, state, level });



  const movement = createMovement({

    state,

    onMoveFinished() {

      // ✅ later we’ll put "level complete popup" here

      // for now just keep it safe

      if (state.isComplete()) {

        setTimeout(() => {

          alert("LEVEL COMPLETE ✅");

        }, 60);

      }

    },

  });



  function requestMove(dx, dy) {

    movement.startMove(dx, dy);

  }



  // Desktop (testing)

  function onKeyDown(e) {

    if (e.key === "ArrowUp") requestMove(0, -1);

    if (e.key === "ArrowDown") requestMove(0, 1);

    if (e.key === "ArrowLeft") requestMove(-1, 0);

    if (e.key === "ArrowRight") requestMove(1, 0);

  }



  // Mobile swipe

  let sx = 0;

  let sy = 0;



  function onTouchStart(e) {

    const t = e.touches[0];

    sx = t.clientX;

    sy = t.clientY;

  }



  function onTouchEnd(e) {

    const t = e.changedTouches[0];

    const dx = t.clientX - sx;

    const dy = t.clientY - sy;



    const ax = Math.abs(dx);

    const ay = Math.abs(dy);

    if (Math.max(ax, ay) < 14) return;



    if (ax > ay) requestMove(dx > 0 ? 1 : -1, 0);

    else requestMove(0, dy > 0 ? 1 : -1);

  }



  function loop(now) {

    movement.update(now);

    renderer.render();

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