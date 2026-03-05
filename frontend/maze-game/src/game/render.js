export function createRenderer({ canvas, state }) {
  const ctx = canvas.getContext("2d");

  let tile = 0;
  let ox = 0;
  let oy = 0;

  const maskCanvas = document.createElement("canvas");
  const maskCtx = maskCanvas.getContext("2d");

  const blurCanvas = document.createElement("canvas");
  const blurCtx = blurCanvas.getContext("2d");

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    canvas.width = w;
    canvas.height = h;

    tile = Math.floor(
      Math.min(w / state.cols, h / state.rows)
    );

    const boardW = state.cols * tile;
    const boardH = state.rows * tile;

    ox = Math.floor((w - boardW) / 2);
    oy = Math.floor((h - boardH) / 2);

    maskCanvas.width = boardW;
    maskCanvas.height = boardH;

    blurCanvas.width = boardW;
    blurCanvas.height = boardH;

    buildMask();
  }

  function buildMask() {
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

    maskCtx.fillStyle = "white";

    const r = tile * 0.42;

    for (let y = 0; y < state.rows; y++) {
      for (let x = 0; x < state.cols; x++) {

        const cell = state.grid[y][x];

        // walkable tiles
        if (cell !== 0 && cell !== 2) continue;

        const cx = x * tile + tile / 2;
        const cy = y * tile + tile / 2;

        maskCtx.beginPath();
        maskCtx.arc(cx, cy, r, 0, Math.PI * 2);
        maskCtx.fill();

        if (x < state.cols - 1) {
          const right = state.grid[y][x + 1];
          if (right === 0 || right === 2) {
            maskCtx.fillRect(cx, cy - r, tile, r * 2);
          }
        }

        if (y < state.rows - 1) {
          const down = state.grid[y + 1][x];
          if (down === 0 || down === 2) {
            maskCtx.fillRect(cx - r, cy, r * 2, tile);
          }
        }
      }
    }

    blurCtx.clearRect(0, 0, blurCanvas.width, blurCanvas.height);
    blurCtx.filter = "blur(10px)";
    blurCtx.drawImage(maskCanvas, 0, 0);
    blurCtx.filter = "none";
  }

  function drawBoard() {
    ctx.fillStyle = "#0f2a1d";
    ctx.fillRect(
      ox,
      oy,
      state.cols * tile,
      state.rows * tile
    );
  }

  function drawEngrave() {
    ctx.save();
    ctx.translate(ox, oy);

    ctx.drawImage(maskCanvas, 0, 0);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    ctx.globalCompositeOperation = "source-over";
    ctx.restore();

    ctx.save();
    ctx.translate(ox, oy);
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = 0.45;
    ctx.drawImage(blurCanvas, 2, 2);
    ctx.restore();

    ctx.save();
    ctx.translate(ox, oy);
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.12;
    ctx.drawImage(blurCanvas, -2, -2);
    ctx.restore();
  }

  function drawBall(player) {
    const r = tile * 0.28;

    const x = ox + player.x * tile + tile / 2;
    const y = oy + player.y * tile + tile / 2;

    const g = ctx.createRadialGradient(
      x - r * 0.4,
      y - r * 0.4,
      r * 0.1,
      x,
      y,
      r
    );

    g.addColorStop(0, "#7fff9a");
    g.addColorStop(1, "#0c7a38");

    ctx.fillStyle = g;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function render(player) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBoard();
    drawEngrave();
    drawBall(player);
  }

  return {
    resize,
    render
  };
}