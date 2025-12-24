// src/game/movement.js



export function createMovement({ state, onMoveFinished }) {

  let moving = false;



  let anim = {

    t0: 0,

    dur: 0,

    sx: 0,

    sy: 0,

    tx: 0,

    ty: 0,

    dist: 0,

    lastPaintCellX: 0,

    lastPaintCellY: 0,

  };



  function findSlideTarget(dx, dy) {

    const sx = state.player.x;

    const sy = state.player.y;



    let x = sx;

    let y = sy;



    while (true) {

      const nx = x + dx;

      const ny = y + dy;

      if (!state.isWalkable(nx, ny)) break;

      x = nx;

      y = ny;

    }



    return { x, y };

  }



  function startMove(dx, dy) {

    if (moving) return;



    if (!dx && !dy) return;



    const target = findSlideTarget(dx, dy);

    if (target.x === state.player.x && target.y === state.player.y) return;



    moving = true;



    anim.t0 = performance.now();

    anim.sx = state.player.x;

    anim.sy = state.player.y;

    anim.tx = target.x;

    anim.ty = target.y;



    const ddx = anim.tx - anim.sx;

    const ddy = anim.ty - anim.sy;

    anim.dist = Math.max(1, Math.abs(ddx) + Math.abs(ddy)); // Manhattan tiles



    // ✅ duration scales with distance (slide feels natural)

    const perTile = 90; // ms per tile

    anim.dur = Math.max(120, anim.dist * perTile);



    anim.lastPaintCellX = anim.sx;

    anim.lastPaintCellY = anim.sy;

  }



  function easeOutCubic(t) {

    return 1 - Math.pow(1 - t, 3);

  }



  function update(now) {

    if (!moving) return;



    const t = (now - anim.t0) / anim.dur;

    const clamped = Math.max(0, Math.min(1, t));

    const k = easeOutCubic(clamped);



    // current float position

    const fx = anim.sx + (anim.tx - anim.sx) * k;

    const fy = anim.sy + (anim.ty - anim.sy) * k;



    // Determine which cell we are "in" during slide:

    // We only slide axis-aligned, so we can safely round

    const cx = Math.round(fx);

    const cy = Math.round(fy);



    // Paint every new cell we pass through

    if (cx !== anim.lastPaintCellX || cy !== anim.lastPaintCellY) {

      // walk from lastPaintCell -> current cell (covers multi-tile jumps)

      const stepX = cx === anim.lastPaintCellX ? 0 : (cx > anim.lastPaintCellX ? 1 : -1);

      const stepY = cy === anim.lastPaintCellY ? 0 : (cy > anim.lastPaintCellY ? 1 : -1);



      let x = anim.lastPaintCellX;

      let y = anim.lastPaintCellY;



      while (x !== cx || y !== cy) {

        if (x !== cx) x += stepX;

        else if (y !== cy) y += stepY;



        if (state.isWalkable(x, y)) state.paint(x, y);

      }



      anim.lastPaintCellX = cx;

      anim.lastPaintCellY = cy;

    }



    // At end, snap player to target

    if (clamped >= 1) {

      state.player.x = anim.tx;

      state.player.y = anim.ty;



      // ensure final tile painted

      if (state.isWalkable(state.player.x, state.player.y)) {

        state.paint(state.player.x, state.player.y);

      }



      moving = false;

      onMoveFinished?.();

    }

  }



  function getAnimatedPlayer(now) {

    if (!moving) return { x: state.player.x, y: state.player.y, moving: false, progress: 0 };



    const t = (now - anim.t0) / anim.dur;

    const clamped = Math.max(0, Math.min(1, t));

    const k = easeOutCubic(clamped);



    const x = anim.sx + (anim.tx - anim.sx) * k;

    const y = anim.sy + (anim.ty - anim.sy) * k;



    return { x, y, moving: true, progress: clamped };

  }



  return {

    startMove,

    update,

    getAnimatedPlayer,

    isMoving() {

      return moving;

    },

  };

}