// src/game/state.js



function key(x, y) {

  return x + "," + y;

}



export function createGameState(level) {

  const grid = level.grid;

  const rows = grid.length;

  const cols = grid[0].length;



  const start = level.start || { x: 1, y: 1 };



  // walkable = 0 or 2

  function isWalkable(x, y) {

    return grid[y] && (grid[y][x] === 0 || grid[y][x] === 2);

  }



  // total walkable tiles in level (must be painted)

  let totalWalkable = 0;

  for (let y = 0; y < rows; y++) {

    for (let x = 0; x < cols; x++) {

      if (isWalkable(x, y)) totalWalkable++;

    }

  }



  const painted = new Set();

  painted.add(key(start.x, start.y));



  const state = {

    grid,

    rows,

    cols,



    // current cell

    player: { x: start.x, y: start.y },



    // render position in cell coordinates (float)

    renderPos: { x: start.x, y: start.y },



    // painted tiles

    painted,

    totalWalkable,



    isWalkable,



    paintCell(x, y) {

      painted.add(key(x, y));

    },



    paintPath(pathCells) {

      for (const c of pathCells) painted.add(key(c.x, c.y));

    },



    isComplete() {

      return painted.size >= totalWalkable;

    },

  };



  return state;

}