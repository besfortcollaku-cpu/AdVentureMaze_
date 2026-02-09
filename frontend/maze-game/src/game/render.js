// ================================
// RENDERER
// ================================

export function createRenderer({ canvas, state }) {
  if (!(canvas instanceof HTMLCanvasElement)) {
    console.error("Renderer: canvas missing");
    return;
  }

  canvas.style.pointerEvents = "none"; // ✅ FIX
  canvas.style.zIndex = "0";           // optional safety
  const ctx = canvas.getContext("2d");
  let tile = 64;
  let ox = 0;
  let oy = 0;
let tileW = 0;
let tileH = 0;
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
  if (!state || !state.cols || !state.rows) return;

  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  // logical size
  w = rect.width;
  h = rect.height;

  // real canvas size
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // base tile size (tiles TOUCH, no gaps)
  tile = Math.floor(
    Math.min(w / state.cols, h / state.rows)
  );

  // center board
  ox = Math.floor((w - state.cols * tile) / 2);
  oy = Math.floor((h - state.rows * tile) / 2);
}

window.addEventListener("resize", resize);
resize();

  // ----------------
  // PERSPECTIVE (TOP SMALL → BOTTOM BIG)
  // ----------------
  function rowScale(y) {
    const t = y / (state.rows - 1);
    return 0.85 + t * 0.3; // tweak values here
  }

  function renderY(y) {
    let py = oy;
    for (let i = 0; i < y; i++) {
      py += tile * rowScale(i);
    }
    return py;
  }

  // ----------------
  // DRAW FLOOR (ALL TILES)
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
      py - tile * 0.25 * scale,
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