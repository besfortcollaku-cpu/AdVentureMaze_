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
        if (state.grid[y][x] === 0) {
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
  }

  function drawWalls() {
    for (let y = 0; y < state.rows; y++) {
      for (let x = 0; x < state.cols; x++) {
        if (state.grid[y][x] === 1) {
          ctx.drawImage(
            sprites.wall,
            ox + x * tile,
            oy + y * tile,
            tile,
            tile
          );
        }
      }
    }
  }

  function drawBall() {
    const b = state.ball;
    if (!b) return;

    ctx.drawImage(
      sprites.ball,
      ox + b.x * tile,
      oy + b.y * tile,
      tile,
      tile
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