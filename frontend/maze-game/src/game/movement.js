// src/game/movement.js

import { startRollSound, stopRollSound } from "./rollSound.js";

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
    anim.dist = Math.max(1, Math.abs(ddx) + Math.abs(ddy));

    // 🔥 SPEED CONTROL (faster)
    const perTile = 45;
    anim.dur = Math.max(70, anim.dist * perTile);

    // 🔊 start rolling sound
    startRollSound(anim.dist);

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

    const fx = anim.sx + (anim.tx - anim.sx) * k;
    const fy = anim.sy + (anim.ty - anim.sy) * k;

    const cx = Math.round(fx);
    const cy = Math.round(fy);

    if (cx !== anim.lastPaintCellX || cy !== anim.lastPaintCellY) {
      const stepX = cx === anim.lastPaintCellX ? 0 : cx > anim.lastPaintCellX ? 1 : -1;
      const stepY = cy === anim.lastPaintCellY ? 0 : cy > anim.lastPaintCellY ? 1 : -1;

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

    if (clamped >= 1) {
      state.player.x = anim.tx;
      state.player.y = anim.ty;

      if (state.isWalkable(state.player.x, state.player.y)) {
        state.paint(state.player.x, state.player.y);
      }

      moving = false;

      // 🔊 stop rolling sound
      stopRollSound();

      onMoveFinished?.();
    }
  }

  function getAnimatedPlayer(now) {
    if (!moving)
      return { x: state.player.x, y: state.player.y, moving: false, progress: 0 };

    const t = (now - anim.t0) / anim.dur;
    const clamped = Math.max(0, Math.min(1, t));
    const k = easeOutCubic(clamped);

    return {
      x: anim.sx + (anim.tx - anim.sx) * k,
      y: anim.sy + (anim.ty - anim.sy) * k,
      moving: true,
      progress: clamped,
    };
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