// src/game/movement.js



export function createMovement({ state, onMoveFinished }) {

  let moving = false;



  const anim = {

    t0: 0,

    dur: 0,

    sx: 0,

    sy: 0,

    tx: 0,

    ty: 0,

    path: [],

  };



  function computeSlideTarget(dx, dy) {

    // move until next step would be blocked

    let x = state.player.x;

    let y = state.player.y;



    const path = [{ x, y }]; // include start cell



    while (true) {

      const nx = x + dx;

      const ny = y + dy;



      if (!state.isWalkable(nx, ny)) break;



      x = nx;

      y = ny;

      path.push({ x, y });

    }



    return { tx: x, ty: y, path };

  }



  function startMove(dx, dy) {

    if (moving) return;



    // no diagonal

    if ((dx !== 0 && dy !== 0) || (dx === 0 && dy === 0)) return;



    const res = computeSlideTarget(dx, dy);



    // if we can't move at all

    if (res.tx === state.player.x && res.ty === state.player.y) return;



    // paint all tiles we will pass over (so level logic matches slide)

    // includes start cell too, harmless

    state.paintPath(res.path);



    // start animation from current renderPos (should match player cell when idle)

    moving = true;



    anim.t0 = performance.now();

    anim.sx = state.renderPos.x;

    anim.sy = state.renderPos.y;

    anim.tx = res.tx;

    anim.ty = res.ty;

    anim.path = res.path;



    const dist = Math.abs(anim.tx - anim.sx) + Math.abs(anim.ty - anim.sy);



    // duration scales with distance

    anim.dur = 120 + dist * 85;



    // commit logical player cell immediately (so progress/save uses target)

    state.player.x = res.tx;

    state.player.y = res.ty;

  }



  function update(now) {

    if (!moving) {

      // keep render position locked to cell when idle

      state.renderPos.x = state.player.x;

      state.renderPos.y = state.player.y;

      return;

    }



    const t = (now - anim.t0) / anim.dur;

    const clamped = Math.max(0, Math.min(1, t));



    // smooth step easing

    const k = 1 - Math.pow(1 - clamped, 3);



    state.renderPos.x = anim.sx + (anim.tx - anim.sx) * k;

    state.renderPos.y = anim.sy + (anim.ty - anim.sy) * k;



    if (t >= 1) {

      moving = false;



      // snap exact

      state.renderPos.x = state.player.x;

      state.renderPos.y = state.player.y;



      onMoveFinished?.();

    }

  }



  return {

    startMove,

    update,

    get moving() {

      return moving;

    },

  };

}