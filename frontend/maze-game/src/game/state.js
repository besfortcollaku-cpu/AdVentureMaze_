// src/game/state.js



function key(x, y) {

  return `${x},${y}`;

}



export function createGameState(level) {

  const grid = level.grid;

  const rows = grid.length;

  const cols = grid[0].length;



  const start = level.start || { x: 1, y: 1 };



  const state = {

    level,

    grid,

    rows,

    cols,



    player: { x: start.x, y: start.y },



    // painted tiles (walkable visited)

    painted: new Set(),



    // total walkable tiles count

    totalWalkable: 0,



    // helpers

    isWalkable(x, y) {

      return !!grid[y] && grid[y][x] === 0;

    },



    paint(x, y) {

      state.painted.add(key(x, y));

    },



    isPainted(x, y) {

      return state.painted.has(key(x, y));

    },



    isComplete() {

      return state.painted.size >= state.totalWalkable && state.totalWalkable > 0;

    },

  };



  // compute total walkable tiles

  let count = 0;

  for (let y = 0; y < rows; y++) {

    for (let x = 0; x < cols; x++) {

      if (grid[y][x] === 0) count++;

    }

  }

  state.totalWalkable = count;



  // paint start tile immediately

  if (state.isWalkable(state.player.x, state.player.y)) {

    state.paint(state.player.x, state.player.y);

  }



  return state;

}