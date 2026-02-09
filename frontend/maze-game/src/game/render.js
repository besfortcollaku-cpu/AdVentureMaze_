// ==============================
// createRenderer EXPORT
// ==============================
export function createRenderer(canvas, state) {
  const ctx = canvas.getContext("2d");
  const tile = 64;

  let ox = 0;
  let oy = 0;

  // ==============================
  // SPRITES
  // ==============================
  const sprites = {};
  const spriteList = {
    floor: "crystal_inner.png",
    wall: "crystal_tile.png",
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

  // ==============================
  // CAMERA OFFSET
  // ==============================
  function computeOffsets() {
    const boardW = state.cols * tile;
    const boardH = state.rows * tile;

    ox = (canvas.width - boardW) / 2;
    oy = (canvas.height - boardH) / 2;
  }

  // ==============================
  // DRAWING
  // ==============================
  function drawFloor() {
    ctx.drawImage(
      sprites.floor,
      ox,
      oy,
      state.cols * tile,
      state.rows * tile
    );
  }

  function drawWalls() {
    for (let y = 0; y < state.rows; y++) {
      for (let x = 0; x < state.cols; x++) {
        if (state.grid[y][x] !== 1) continue;

        const px = ox + x * tile;
        const py = oy + y * tile;

        ctx.drawImage(sprites.wall, px, py, tile, tile);
      }
    }
  }

  function drawBall() {
    const px = ox + state.ball.x * tile;
    const py = oy + state.ball.y * tile;

    ctx.drawImage(sprites.ball, px, py, tile, tile);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    computeOffsets();
    drawFloor();
    drawWalls();
    drawBall();
  }

  // ==============================
  // PUBLIC API
  // ==============================
  loadSprites(() => {
    requestAnimationFrame(loop);
  });

  function loop() {
    draw();
    requestAnimationFrame(loop);
  }

  // optional return if needed later
  return {
    redraw: draw
  };
  // ===============================
  // START RENDERING AFTER LOAD
  // ===============================
  loadSprites(() => {
    requestAnimationFrame(render);
  });

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawFloor();
    drawWalls();
    drawBall();

    requestAnimationFrame(render);
  }
}
