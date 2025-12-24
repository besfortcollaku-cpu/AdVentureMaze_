// src/game/movement.js
// STEP 6: Sliding movement logic
// Ball moves until it hits a wall (not tile-by-tile)

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function requestSlide(state, dx, dy) {
  if (state.moving) return false;

  const { player } = state;

  // find farthest reachable cell in that direction
  let x = player.x;
  let y = player.y;

  while (true) {
    const nx = x + dx;
    const ny = y + dy;
    if (!state.isFree(nx, ny)) break;
    x = nx;
    y = ny;
  }

  // no movement
  if (x === player.x && y === player.y) return false;

  // paint the path immediately (logic)
  state.paintLine(player.x, player.y, x, y);

  // setup animation
  state.moving = true;
  state.move.t0 = performance.now();

  state.move.sx = state.playerFloat.x;
  state.move.sy = state.playerFloat.y;

  state.move.tx = x;
  state.move.ty = y;

  // duration depends on distance
  const dist = Math.abs(x - player.x) + Math.abs(y - player.y);
  state.move.dur = 120 + dist * 90;

  // update integer player target now
  state.player.x = x;
  state.player.y = y;

  return true;
}

export function updateMovement(state, now) {
  if (!state.moving) {
    // ensure float follows integer when idle
    state.playerFloat.x = state.player.x;
    state.playerFloat.y = state.player.y;
    return;
  }

  const tRaw = (now - state.move.t0) / state.move.dur;
  const t = Math.max(0, Math.min(1, tRaw));
  const k = easeOutCubic(t);

  state.playerFloat.x = state.move.sx + (state.move.tx - state.move.sx) * k;
  state.playerFloat.y = state.move.sy + (state.move.ty - state.move.sy) * k;

  if (t >= 1) {
    state.moving = false;
    state.playerFloat.x = state.player.x;
    state.playerFloat.y = state.player.y;
  }
}