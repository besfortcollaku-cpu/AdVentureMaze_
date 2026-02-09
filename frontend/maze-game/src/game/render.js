// src/game/render.js

export function createRenderer(arg1, arg2) {
    const WALL_HEIGHT = 18;   // visual wall depth
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

  // ==============================
  // SPRITES
  // ==============================
  const sprites = {};
  const spriteList = {
    floor: "crystal_inner.png",
    floor_edge: "floor_edge.png",
    wall: "wall_center.png",
    wall_corner: "wall_corner.png",
    shadow: "crystal_shadow.png",
    ball: "ball.png",
  };

  function loadSprites(cb) {
    let loaded = 0;
    const keys = Object.keys(spriteList);

    keys.forEach((key) => {
      const img = new Image();
      img.src = `/textures/sprites/crystal/${spriteList[key]}`;
      img.onload = () => {
        sprites[key] = img;
        loaded++;
        if (loaded === keys.length) cb();
      };
      img.onerror = () => {
        console.warn("Missing sprite:", img.src);
        loaded++;
        if (loaded === keys.length) cb();
      };
    });
  }

  // ==============================
  // TILE / CAMERA
  // ==============================
  let tile = 64;
  let ox = 0;
  let oy = 0;

  function computeTileSize() {
    // Fit whole board into canvas (no cropping)
    const maxTile = 64;
    const fitX = Math.floor(canvas.width / state.cols);
    const fitY = Math.floor(canvas.height / state.rows);
    tile = Math.max(18, Math.min(maxTile, fitX, fitY));
  }

  function computeOffsets() {
    const boardW = state.cols * tile;
    const boardH = state.rows * tile;
    ox = Math.floor((canvas.width - boardW) / 2);
    oy = Math.floor((canvas.height - boardH) / 2);
  }

  function px(x) {
    return ox + x * tile;
  }
  function py(y) {
    return oy + y * tile;
  }

  // ==============================
  // DRAW
  // ==============================
  function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawFloor() {
  for (let y = 0; y < state.rows; y++) {
    for (let x = 0; x < state.cols; x++) {
      ctx.drawImage(
        sprites.floor,
        ox + x * tile,
        oy + y * tile,
        tile,
        tile
      );
    }
  }
}

function drawWalls() {
    console.log("drawWalls CALLED");
  for (let y = 0; y < state.rows; y++) {
    for (let x = 0; x < state.cols; x++) {
      if (state.grid[y][x] !== 1) continue;

      const baseX = ox + x * tile;
      const baseY = oy + y * tile;

      // 1️⃣ wall side (depth)
      ctx.drawImage(
        sprites.floor_edge,   // reuse floor edge as wall side
        baseX,
        baseY + tile - WALL_HEIGHT,
        tile,
        WALL_HEIGHT
      );

      // 2️⃣ wall top (main block)
      ctx.drawImage(
        sprites.wall,
        baseX,
        baseY - WALL_HEIGHT,
        tile,
        tile
      );
    }
  }
}
  function drawBall() {
    const ballImg = sprites.ball;
    if (!ballImg) return;

    const shadowImg = sprites.shadow;

    const bx = state.player?.x ?? 0;
    const by = state.player?.y ?? 0;

    const BALL_SIZE = Math.round(tile * 0.72);
    const BALL_LIFT = Math.max(6, Math.round(tile * 0.18));

    const x = px(bx) + (tile - BALL_SIZE) / 2;
    const y = py(by) + (tile - BALL_SIZE) / 2 - BALL_LIFT;

    // shadow under ball
    if (shadowImg) {
      const sw = Math.round(tile * 0.9);
      const sh = Math.round(tile * 0.35);
      ctx.globalAlpha = 0.9;
      ctx.drawImage(
        shadowImg,
        px(bx) + (tile - sw) / 2,
        py(by) + tile * 0.58,
        sw,
        sh
      );
      ctx.globalAlpha = 1;
    }

    ctx.drawImage(ballImg, x, y, BALL_SIZE, BALL_SIZE);
  }

  function loop() {
    computeTileSize();
    computeOffsets();
    clear();

    drawFloor();
    drawWalls();
    drawBall();

    requestAnimationFrame(loop);
  }

  loadSprites(() => {
    loop();
  });
}