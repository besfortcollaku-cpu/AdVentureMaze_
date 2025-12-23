// src/game/state.js



export function createGameState(level) {

  const grid = level.grid;

  const rows = grid.length;

  const cols = grid[0].length;



  const start = level.start || { x: 1, y: 1 };



  // painted tiles (only floor tiles)

  const painted = new Set();



  // count all floor tiles (0 = floor)

  let totalFloor = 0;

  for (let y = 0; y < rows; y++) {

    for (let x = 0; x < cols; x++) {

      if (grid[y][x] === 0) totalFloor++;

    }

  }



  // player cell position (can be float while animating)

  let playerX = start.x;

  let playerY = start.y;



  function key(x, y) {

    return `${x},${y}`;

  }



  function isInside(x, y) {

    return y >= 0 && y < rows && x >= 0 && x < cols;

  }



  function isWall(x, y) {

    if (!isInside(x, y)) return true;

    return grid[y][x] === 1;

  }



  function isFloor(x, y) {

    if (!isInside(x, y)) return false;

    return grid[y][x] === 0;

  }



  function paintCell(x, y) {

    if (!isFloor(x, y)) return;

    painted.add(key(x, y));

  }



  // paint start tile immediately

  paintCell(start.x, start.y);



  function isComplete() {

    return painted.size >= totalFloor;

  }



  function getStats() {

    return {

      levelId: level.id || 1,

      painted: painted.size,

      total: totalFloor,

    };

  }



  return {

    levelId: level.id || 1,

    grid,

    rows,

    cols,



    painted,



    // position

    get playerX() {

      return playerX;

    },

    get playerY() {

      return playerY;

    },

    set playerX(v) {

      playerX = v;

    },

    set playerY(v) {

      playerY = v;

    },



    // helpers

    isWall,

    isFloor,

    paintCell,

    isComplete,

    getStats,

  };

}