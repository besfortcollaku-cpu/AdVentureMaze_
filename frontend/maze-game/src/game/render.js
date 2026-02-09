// ================================
// RENDERER
// ================================

export function createRenderer({ canvas, state }) {
  const ctx = canvas.getContext("2d");

  let tile = 64;
  let ox = 0;
  let oy = 0;

  // ----------------
  // IMAGES
  // ----------------
  const floorImg = new Image();
  floorImg.src = "/textures/sprites/crystal/crystal_side.png";

  const ballImg = new Image();
  ballImg.src = "/textures/sprites/ball.png";

  // ----------------
  // RESIZE
  // ----------------
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // base tile size (NO gaps)
    tile = Math.floor(
      Math.min(rect.width / state.cols, rect.height / state.rows)
    );

    ox = Math.floor((rect.width - state.cols * tile) / 2);
    oy = Math.floor((rect.height - state.rows * tile) / 2);
  }

  window.addEventListener("resize", resize);
  resize();

  // ----------------
  // PERSPECTIVE
  // ----------------
  function rowScale(y) {
    const t = y / (state.rows - 1);
    return 0.85 + t * 0.3; // top smaller, bottom larger
  }

  function renderY(y) {
    let py = oy;
    for (let i = 0; i < y; i++) {
      py += tile * rowScale(i);
    }
    return py;
  }

  // ----------------
  // DRAW FLOOR (EVERY TILE)
  // ----------------
  function drawFloor() {
    for (let y = 0; y < state.rows; y++) {
      const scale = rowScale(y);
      const py = renderY(y);

      for (let x = 0; x < state.cols; x++) {
        const px = ox + x * tile;

        ctx.drawImage(
          floorImg,
          px,
          py,
          tile,
          tile * scale
        );
      }
    }
  }

  // ----------------
  // DRAW BALL
  // ----------------
  function drawBall() {
    const { x, y } = state.ball;
    const scale = rowScale(y);

    const px = ox + x * tile;
    const py = renderY(y);

    ctx.drawImage(
      ballImg,
      px,
      py - tile * 0.2 * scale,
      tile,
      tile * scale
    );
  }

  // ----------------
  // MAIN DRAW
  // ----------------
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawFloor();
    drawBall();
  }

  // ----------------
  // LOOP
  // ----------------
  function loop() {
    draw();
    requestAnimationFrame(loop);
  }

  loop();
}