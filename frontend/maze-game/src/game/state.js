// src/game/state.js
// Holds: grid, player position, painted tiles, win detection

export function createState(level) {
  const grid = level.grid;
  const rows = grid.length;
  const cols = grid[0].length;

  const start = level.start || { x: 1, y: 1 };

  const painted = new Set();
  const key = (x, y) => `${x},${y}`;

  function isInside(x, y) {
    return x >= 0 && y >= 0 && x < cols && y < rows;
  }

  function isWall(x, y) {
    if (!isInside(x, y)) return true;
    return grid[y][x] === 1;
  }

  function isFree(x, y) {
    if (!isInside(x, y)) return false;
    return grid[y][x] === 0 || grid[y][x] === 2;
  }

  // count all free tiles once
  let totalFree = 0;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (isFree(x, y)) totalFree++;
    }
  }

  const state = {
    level,
    grid,
    rows,
    cols,

    // player integer cell (target cell)
    player: { x: start.x, y: start.y },

    // player float for animation (render uses this)
    playerFloat: { x: start.x, y: start.y },

    // movement state
    moving: false,
    move: {
      t0: 0,
      dur: 0,
      sx: start.x,
      sy: start.y,
      tx: start.x,
      ty: start.y,
    },

    // painting
    painted,
    totalFree,

    isFree,
    isWall,
    isPainted(x, y) {
      return painted.has(key(x, y));
    },

    paint(x, y) {
      if (isFree(x, y)) painted.add(key(x, y));
    },

    paintLine(ax, ay, bx, by) {
      const dx = Math.sign(bx - ax);
      const dy = Math.sign(by - ay);
      let x = ax;
      let y = ay;
      state.paint(x, y);
      while (!(x === bx && y === by)) {
        x += dx;
        y += dy;
        state.paint(x, y);
      }
    },

    isComplete() {
      return painted.size >= totalFree;
    },
  };

  // paint start tile immediately
  state.paint(start.x, start.y);

  return state;
}