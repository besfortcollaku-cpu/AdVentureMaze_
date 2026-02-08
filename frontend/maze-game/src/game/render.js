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



    // base tile fits grid

    const base = Math.min(w / state.cols, h / state.rows);

    const zoom = typeof state.level.zoom === "number" ? state.level.zoom : 1.0;



    // requested tile size

    let t = Math.floor(base * zoom);



    // cap so it always fits (important if zoom > 1)

    t = Math.min(t, Math.floor(w / state.cols), Math.floor(h / state.rows));

    tile = Math.max(10, t);



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
  // canvas must stay fully transparent
  ctx.clearRect(0, 0, w, h);
}



  function drawMaze() {
  // ─────────────────────────────
  // PASS 1: BASE (NO CANVAS BG)
  // ─────────────────────────────
  ctx.clearRect(0, 0, w, h);

  // ─────────────────────────────
  // PASS 2: CONTINUOUS PATH BASE
  // ─────────────────────────────
  ctx.fillStyle = "#0a1626"; // dark path base (darker than app bg)

  for (let y = 0; y < state.rows; y++) {
    for (let x = 0; x < state.cols; x++) {
      if (state.grid[y][x] === 1) continue;

      const px = ox + x * tile;
      const py = oy + y * tile;

      // full tile
      ctx.fillRect(px, py, tile, tile);

      // horizontal merge
      if (x < state.cols - 1 && state.grid[y][x + 1] === 0) {
        ctx.fillRect(px + tile - 1, py, 2, tile);
      }

      // vertical merge
      if (y < state.rows - 1 && state.grid[y + 1][x] === 0) {
        ctx.fillRect(px, py + tile - 1, tile, 2);
      }
    }
  }

  // ─────────────────────────────
  // PASS 3: ENGRAVED SHADOW (DEPTH)
  // ─────────────────────────────
  ctx.fillStyle = "rgba(0,0,0,0.6)";

  for (let y = 0; y < state.rows; y++) {
    for (let x = 0; x < state.cols; x++) {
      if (state.grid[y][x] === 1) continue;

      const px = ox + x * tile;
      const py = oy + y * tile;

      ctx.fillRect(px, py, tile, 2); // top
      ctx.fillRect(px, py, 2, tile); // left
    }
  }

  // ─────────────────────────────
  // PASS 4: VISITED / PAINTED PATH (NO GAPS)
  // ─────────────────────────────
  ctx.fillStyle = "#25d7ff";

  for (let y = 0; y < state.rows; y++) {
    for (let x = 0; x < state.cols; x++) {
      if (!state.isPainted(x, y)) continue;

      const px = ox + x * tile;
      const py = oy + y * tile;

      ctx.fillRect(px, py, tile, tile);

      // merge painted neighbors
      if (x < state.cols - 1 && state.isPainted(x + 1, y)) {
        ctx.fillRect(px + tile - 1, py, 2, tile);
      }
      if (y < state.rows - 1 && state.isPainted(x, y + 1)) {
        ctx.fillRect(px, py + tile - 1, tile, 2);
      }
    }
  }
}

  function drawBall(playerFloat) {
  const r = Math.max(10, tile * 0.24);
  const c = cellCenter(playerFloat.x, playerFloat.y);
  const t = performance.now() * 0.002;

  // ─────────────────────────
  // SHADOW (ground contact)
  // ─────────────────────────
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(
    c.cx + r * 0.15,
    c.cy + r * 0.6,
    r * 1.1,
    r * 0.55,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // ─────────────────────────
  // GOLD GRADIENT (3D CORE)
  // ─────────────────────────
  const gx = c.cx - r * 0.45 + Math.sin(t) * r * 0.15;
  const gy = c.cy - r * 0.5 + Math.cos(t * 0.8) * r * 0.15;

  const grad = ctx.createRadialGradient(gx, gy, r * 0.15, c.cx, c.cy, r);
  grad.addColorStop(0.0, "#fff6c4");
  grad.addColorStop(0.25, "#ffd54a");
  grad.addColorStop(0.55, "#f1b400");
  grad.addColorStop(0.8, "#b97a00");
  grad.addColorStop(1.0, "#6f4a00");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(c.cx, c.cy, r, 0, Math.PI * 2);
  ctx.fill();

  // ─────────────────────────
  // INNER SHADOW (DEPTH)
  // ─────────────────────────
  ctx.strokeStyle = "rgba(0,0,0,0.28)";
  ctx.lineWidth = r * 0.18;
  ctx.beginPath();
  ctx.arc(c.cx, c.cy, r - ctx.lineWidth / 2, 0, Math.PI * 2);
  ctx.stroke();

  // ─────────────────────────
  // ROLLING SHINE (ANIMATED)
  // ─────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.ellipse(
    c.cx - r * 0.35 + Math.sin(t * 1.2) * r * 0.12,
    c.cy - r * 0.4 + Math.cos(t) * r * 0.1,
    r * 0.35,
    r * 0.22,
    -0.4,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // ─────────────────────────
  // IMPACT GLOW (SOFT)
  // ─────────────────────────
  ctx.strokeStyle = "rgba(255,210,90,0.35)";
  ctx.lineWidth = 2 + Math.sin(t * 2) * 0.8;
  ctx.beginPath();
  ctx.arc(c.cx, c.cy, r + 1.5, 0, Math.PI * 2);
  ctx.stroke();

  // ─────────────────────────
  // MICRO SPARK SHIMMER
  // ─────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  for (let i = 0; i < 3; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = r * (0.6 + Math.random() * 0.3);
    ctx.beginPath();
    ctx.arc(
      c.cx + Math.cos(a) * d,
      c.cy + Math.sin(a) * d,
      0.8,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

  function render(playerFloat) {

    ctx.clearRect(0, 0, w, h);

    drawBackground();

    drawMaze();

    drawBall(playerFloat);

  }



  return { resize, render };

}