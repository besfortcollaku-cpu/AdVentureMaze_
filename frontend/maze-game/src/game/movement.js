// src/game/movement.js



export function createMovement({ state, onMoveFinished }) {

  let moving = false;



  // animation data

  const anim = {

    t0: 0,

    dur: 220, // feel free later; keeps it smooth

    sx: 0,

    sy: 0,

    tx: 0,

    ty: 0,

    steps: 0,

    dx: 0,

    dy: 0,

    paintedSteps: 0, // how many tiles already painted during this move

    finishedCalled: false,

  };



  function computeSlideSteps(dx, dy) {

    // starting from CURRENT integer cell

    const cx = Math.round(state.playerX);

    const cy = Math.round(state.playerY);



    // if already in motion, we don’t compute

    let x = cx;

    let y = cy;



    let steps = 0;



    while (true) {

      const nx = x + dx;

      const ny = y + dy;



      if (state.isWall(nx, ny)) break;



      x = nx;

      y = ny;

      steps++;



      // safety (should never hit, but avoids infinite loops)

      if (steps > 9999) break;

    }



    return steps;

  }



  function startMove(dx, dy) {

    if (moving) return;



    // no diagonals

    if ((dx !== 0 && dy !== 0) || (dx === 0 && dy === 0)) return;



    const steps = computeSlideSteps(dx, dy);

    if (steps <= 0) return; // can't move (wall next)



    moving = true;



    anim.t0 = performance.now();

    anim.dx = dx;

    anim.dy = dy;



    // start is current integer cell

    anim.sx = Math.round(state.playerX);

    anim.sy = Math.round(state.playerY);



    // target is start + steps * dir

    anim.tx = anim.sx + dx * steps;

    anim.ty = anim.sy + dy * steps;



    anim.steps = steps;

    anim.paintedSteps = 0;

    anim.finishedCalled = false;



    // IMPORTANT: keep state player cell at start until update() moves it smoothly

    state.playerX = anim.sx;

    state.playerY = anim.sy;

  }



  function update(now) {

    if (!moving) {

      return { x: state.playerX, y: state.playerY };

    }



    const tRaw = (now - anim.t0) / anim.dur;

    const t = Math.max(0, Math.min(1, tRaw));



    // smooth (ease out)

    const k = 1 - Math.pow(1 - t, 3);



    // float position along straight line

    const fx = anim.sx + (anim.tx - anim.sx) * k;

    const fy = anim.sy + (anim.ty - anim.sy) * k;



    state.playerX = fx;

    state.playerY = fy;



    // ---- paint tiles AS YOU PASS THEM (not all at once) ----

    // we convert progress into "how many step tiles have been crossed"

    // stepsCrossed in [0..steps]

    const stepsCrossed = Math.floor(k * anim.steps);



    // paint newly crossed tiles (excluding start)

    while (anim.paintedSteps < stepsCrossed) {

      anim.paintedSteps++;

      const px = anim.sx + anim.dx * anim.paintedSteps;

      const py = anim.sy + anim.dy * anim.paintedSteps;

      state.paintCell(px, py);

    }



    // finish

    if (t >= 1 && !anim.finishedCalled) {

      anim.finishedCalled = true;

      moving = false;



      // snap exactly to target cell

      state.playerX = anim.tx;

      state.playerY = anim.ty;



      // make sure final tile is painted

      state.paintCell(anim.tx, anim.ty);



      onMoveFinished?.();

    }



    return { x: state.playerX, y: state.playerY };

  }



  return {

    startMove,

    update,

    get moving() {

      return moving;

    },

  };

}