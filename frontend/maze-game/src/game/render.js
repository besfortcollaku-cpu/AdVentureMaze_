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
  const t = performance.now() * 0.0015;

  // ─────────────────────────
  // CONTACT SHADOW (REALISTIC)
  // ─────────────────────────
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.ellipse(
    c.cx + r * 0.2,
    c.cy + r * 0.65,
    r * 1.15,
    r * 0.55,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // ─────────────────────────
  // MAIN METAL BODY (GOLD)
  // Light source: top-left
  // ─────────────────────────
  const lx = c.cx - r * 0.6;
  const ly = c.cy - r * 0.7;

  const metal = ctx.createRadialGradient(
    lx, ly, r * 0.15,
    c.cx, c.cy, r
  );

  metal.addColorStop(0.0, "#fff9dc");
  metal.addColorStop(0.18, "#ffe066");
  metal.addColorStop(0.45, "#e6b200");
  metal.addColorStop(0.75, "#9c6b00");
  metal.addColorStop(1.0, "#3e2a00");

  ctx.fillStyle = metal;
  ctx.beginPath();
  ctx.arc(c.cx, c.cy, r, 0, Math.PI * 2);
  ctx.fill();

  // ─────────────────────────
  // INNER SHADE (DEPTH RIM)
  // ─────────────────────────
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = r * 0.22;
  ctx.beginPath();
  ctx.arc(c.cx, c.cy, r - ctx.lineWidth / 2, 0, Math.PI * 2);
  ctx.stroke();

  // ─────────────────────────
  // SPECULAR HIGHLIGHT (SHARP)
  // ─────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.ellipse(
    c.cx - r * 0.42,
    c.cy - r * 0.48,
    r * 0.22,
    r * 0.18,
    -0.4,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // ─────────────────────────
  // SECONDARY REFLECTION (SOFT METAL)
  // ─────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.ellipse(
    c.cx + r * 0.25,
    c.cy + r * 0.15,
    r * 0.45,
    r * 0.32,
    0.3,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // ─────────────────────────
  // SUBTLE GOLD GLOW (NOT NEON)
  // ─────────────────────────
  ctx.strokeStyle = "rgba(255,200,80,0.25)";
  ctx.lineWidth = 1.5 + Math.sin(t * 2) * 0.6;
  ctx.beginPath();
  ctx.arc(c.cx, c.cy, r + 1.5, 0, Math.PI * 2);
  ctx.stroke();
}
  function render(playerFloat) {

    ctx.clearRect(0, 0, w, h);

    drawBackground();

    drawMaze();

    drawBall(playerFloat);

  }



  return { resize, render };

}