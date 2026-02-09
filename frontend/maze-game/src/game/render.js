// src/game/render.js

export function createRenderer({ canvas, state }) {
  const ctx = canvas.getContext("2d");

  let w = 0;
  let h = 0;
  let tile = 40;
  let ox = 0;
  let oy = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    w = rect.width;
    h = rect.height;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const base = Math.min(w / state.cols, h / state.rows);
    tile = Math.max(12, Math.floor(base));
    ox = Math.floor((w - state.cols * tile) / 2);
    oy = Math.floor((h - state.rows * tile) / 2);
  }

  function cellCenter(x, y) {
    return {
      cx: ox + x * tile + tile / 2,
      cy: oy + y * tile + tile / 2,
    };
  }

  function drawBackground() {
    ctx.clearRect(0, 0, w, h);
  }

  // ─────────────────────────────
  // CONTINUOUS BOARD (NO TILES)
  // ─────────────────────────────
  function drawMaze() {
    const inset = tile * 0.14;
    const depth = tile * 0.28;

    // ---------- BASE BOARD ----------
    const bw = state.cols * tile;
    const bh = state.rows * tile;

    ctx.save();

    // soft board shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(
      ox + bw / 2,
      oy + bh + tile * 0.5,
      bw * 0.55,
      tile * 0.45,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // board plate
    const boardGrad = ctx.createLinearGradient(
      ox,
      oy + bh,
      ox + bw,
      oy
    );
    boardGrad.addColorStop(0, "#0b1d33");
    boardGrad.addColorStop(1, "#162c4f");

    ctx.fillStyle = boardGrad;
    ctx.fillRect(
      ox - tile * 0.25,
      oy - tile * 0.25,
      bw + tile * 0.5,
      bh + tile * 0.5
    );

    ctx.restore();

    // ---------- TRENCH (ONE SHAPE) ----------
    ctx.save();
    ctx.beginPath();

    for (let y = 0; y < state.rows; y++) {
      for (let x = 0; x < state.cols; x++) {
        if (state.grid[y][x] === 0) {
          ctx.rect(
            ox + x * tile,
            oy + y * tile,
            tile,
            tile
          );
        }
      }
    }

    // trench fill
    const trenchGrad = ctx.createLinearGradient(
      ox,
      oy,
      ox,
      oy + bh
    );
    trenchGrad.addColorStop(0, "rgba(0,0,0,0.30)");
    trenchGrad.addColorStop(1, "rgba(0,0,0,0.55)");

    ctx.fillStyle = trenchGrad;
    ctx.fill();

    // inner shadow (engraved depth)
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = inset * 2;
    ctx.stroke();

    ctx.restore();

    // ---------- PAINTED PATH (CONTINUOUS) ----------
    ctx.save();
    ctx.beginPath();

    for (let y = 0; y < state.rows; y++) {
      for (let x = 0; x < state.cols; x++) {
        if (state.isPainted(x, y)) {
          ctx.rect(
            ox + x * tile + inset,
            oy + y * tile + inset,
            tile - inset * 2,
            tile - inset * 2
          );
        }
      }
    }

    const pathGrad = ctx.createLinearGradient(
      ox,
      oy,
      ox,
      oy + bh
    );
    pathGrad.addColorStop(0, "#6fe9ff");
    pathGrad.addColorStop(0.5, "#25d7ff");
    pathGrad.addColorStop(1, "#0b6f99");

    ctx.fillStyle = pathGrad;
    ctx.fill();

    // subtle specular line
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    // ---------- WALL BLOCKS ----------
    for (let y = 0; y < state.rows; y++) {
      for (let x = 0; x < state.cols; x++) {
        if (state.grid[y][x] !== 1) continue;

        const px = ox + x * tile;
        const py = oy + y * tile;

        // block shadow
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(
          px + depth * 0.3,
          py + depth * 0.6,
          tile,
          tile
        );

        // block top
        const topGrad = ctx.createLinearGradient(
          px,
          py,
          px + tile,
          py + tile
        );
        topGrad.addColorStop(0, "rgba(255,255,255,0.25)");
        topGrad.addColorStop(1, "rgba(0,0,0,0.25)");

        ctx.fillStyle = topGrad;
        ctx.fillRect(px, py, tile, tile);
      }
    }
  }

  // ─────────────────────────────
  // BALL (FIXED & 3D)
  // ─────────────────────────────
  function drawBall(playerFloat) {
    const r = tile * 0.26;
    const c = cellCenter(playerFloat.x, playerFloat.y);

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.ellipse(
      c.cx + r * 0.25,
      c.cy + r * 0.75,
      r * 1.1,
      r * 0.55,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // gold body
    const metal = ctx.createRadialGradient(
      c.cx - r * 0.4,
      c.cy - r * 0.4,
      r * 0.1,
      c.cx,
      c.cy,
      r
    );
    metal.addColorStop(0, "#fffbe6");
    metal.addColorStop(0.3, "#ffe27a");
    metal.addColorStop(0.6, "#e6b200");
    metal.addColorStop(1, "#3a2600");

    ctx.fillStyle = metal;
    ctx.beginPath();
    ctx.arc(c.cx, c.cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function render(playerFloat) {
    ctx.clearRect(0, 0, w, h);
    drawBackground();
    drawMaze();
    drawBall(playerFloat);
  }

  return { resize, render };
}