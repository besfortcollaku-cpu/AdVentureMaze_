// src/game/state.js

export function createGameState(level) {
  const grid = level.grid;

  const rows = grid.length;
  const cols = grid[0].length;

  // Track painted tiles
  const painted = Array.from({ length: rows }, () =>
    Array(cols).fill(false)
  );

  let freeTileCount = 0;
  let paintedCount = 0;

  let player = {
    row: 0,
    col: 0,
  };

  // Init state from level grid
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];

      if (cell === 0 || cell === 2) {
        freeTileCount++;
      }

      if (cell === 2) {
        player.row = r;
        player.col = c;
        paintTile(r, c);
      }
    }
  }

  function isWall(r, c) {
    return grid[r]?.[c] === 1;
  }

  function paintTile(r, c) {
    if (!painted[r][c]) {
      painted[r][c] = true;
      paintedCount++;
    }
  }

  function allTilesPainted() {
    return paintedCount >= freeTileCount;
  }

  function movePlayerTo(r, c) {
    player.row = r;
    player.col = c;
    paintTile(r, c);
  }

  return {
    grid,
    rows,
    cols,

    player,
    painted,

    isWall,
    movePlayerTo,
    allTilesPainted,
  };
}