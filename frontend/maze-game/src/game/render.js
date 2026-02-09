// ==============================
// createRenderer EXPORT
// ==============================
export function createRenderer(arg1, arg2) {
    const RENDER_TILE = 96; // visual size of sprites
  let canvas, state;

  // game.js calls: createRenderer({ canvas, state })
  if (arg1 && arg1.canvas && arg1.state) {
    canvas = arg1.canvas;
    state = arg1.state;
  } else {
    // fallback (old style): createRenderer(canvas, state)
    canvas = arg1;
    state = arg2;
  }

  if (!(canvas instanceof HTMLCanvasElement)) {
    console.error("createRenderer expected <canvas>, got:", canvas);
    return;
  }

  const ctx = canvas.getContext("2d");
  const tile = 64;
  const WALL_HEIGHT = 18;   // visual height of walls
const BALL_LIFT   = 10;   // how much the ball floats

  let ox = 0;
  let oy = 0;

  // ==============================
  // SPRITES
  // ==============================
  const sprites = {};
  const spriteList = {
  floor: "crystal_inner.png",
  floor_edge: "floor_edge.png",
  wall_center: "wall_center.png",
  wall_corner: "wall_corner.png",
  ball: "ball.png"
  };

  function loadSprites(cb) {
    let loaded = 0;
    const keys = Object.keys(spriteList);

    keys.forEach(key => {
      const img = new Image();
      img.src = `/textures/sprites/crystal/${spriteList[key]}`;
      img.onload = () => {
        sprites[key] = img;
        loaded++;
        if (loaded === keys.length) cb();
      };
    });
  }
 function renderX(x) {
  return ox + x * tile - (RENDER_TILE - tile) / 2;
}

function renderY(y) {
  return oy + y * tile - (RENDER_TILE - tile) / 2;
}

  // ==============================
  // CAMERA CENTERING
  // ==============================
  function computeOffsets() {
    const boardW = state.cols * tile;
    const boardH = state.rows * tile;
    ox = (canvas.width - boardW) / 2;
    oy = (canvas.height - boardH) / 2;
  }

  // ==============================
  // DRAW FUNCTIONS
  // ==============================
  function drawFloor() {
  for (let y = 0; y < state.rows; y++) {
    for (let x = 0; x < state.cols; x++) {
      if (state.grid[y][x] !== 0) continue;

      // check neighbors
      const up    = y === 0 || state.grid[y - 1][x] === 1;
      const down  = y === state.rows - 1 || state.grid[y + 1][x] === 1;
      const left  = x === 0 || state.grid[y][x - 1] === 1;
      const right = x === state.cols - 1 || state.grid[y][x + 1] === 1;

      const isEdge = up || down || left || right;

      const sprite = isEdge
        ? sprites.floor_edge
        : sprites.floor;

      ctx.drawImage(
        sprite,
        ox + x * tile - (RENDER_TILE - tile) / 2,
oy + y * tile - (RENDER_TILE - tile) / 2,
        RENDER_TILE,
        RENDER_TILE
);
      }
    }
  }

  function drawWalls() {
  for (let y = 0; y < state.rows; y++) {
    for (let x = 0; x < state.cols; x++) {
      if (state.grid[y][x] !== 1) continue;

      const up    = y === 0 || state.grid[y - 1][x] === 0;
      const down  = y === state.rows - 1 || state.grid[y + 1][x] === 0;
      const left  = x === 0 || state.grid[y][x - 1] === 0;
      const right = x === state.cols - 1 || state.grid[y][x + 1] === 0;

      const isCorner =
        (up && left) ||
        (up && right) ||
        (down && left) ||
        (down && right);

      const topSprite = isCorner
        ? sprites.wall_corner
        : sprites.wall_center;

      // wall side (depth)
      ctx.drawImage(
        sprites.floor_edge,
        renderX(x),
        oy + y * tile + tile - WALL_HEIGHT,
        RENDER_TILE,
        WALL_HEIGHT
      );

      // wall top
      ctx.drawImage(
        topSprite,
        renderX(x),
        renderY(y) - WALL_HEIGHT,
        RENDER_TILE,
        RENDER_TILE
      );
    }
  }
}
  function drawBall() {
  const { x, y } = state.player;

  ctx.drawImage(
    sprites.ball,
    renderX(x),
    renderY(y) - BALL_LIFT,
    RENDER_TILE,
    RENDER_TILE
  );
}
  // ==============================
  // MAIN LOOP
  // ==============================
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    computeOffsets();
    drawFloor();
    drawWalls();
    drawBall();
    requestAnimationFrame(render);
  }

  // ==============================
  // START
  // ==============================
  loadSprites(() => {
    requestAnimationFrame(render);
  });

  // optional API
  return {
    redraw: render
  };
}