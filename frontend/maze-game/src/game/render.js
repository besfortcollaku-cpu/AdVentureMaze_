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
  for (let y = 0; y < state.rows; y++) {
    for (let x = 0; x < state.cols; x++) {
      const px = ox + x * tile;
      const py = oy + y * tile;

      // ─────────────────────────────
      // WALLS → FULLY TRANSPARENT
      // ─────────────────────────────
      if (state.grid[y][x] === 1) {
        // draw NOTHING for walls
        continue;
      }

      // ─────────────────────────────
      // PATH / WALKABLE AREA
      // ─────────────────────────────

      // dark base path (engraved surface)
      ctx.fillStyle = "rgba(6, 14, 26, 0.9)"; // darker than app bg
      ctx.fillRect(px, py, tile, tile);

      // engraved shadow (top + left)
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(px, py, tile, 2);
      ctx.fillRect(px, py, 2, tile);

      // subtle highlight (bottom + right)
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(px, py + tile - 2, tile, 2);
      ctx.fillRect(px + tile - 2, py, 2, tile);

      // painted / visited path
      if (state.isPainted(x, y)) {
        ctx.fillStyle = "rgba(37,215,255,0.85)";
        ctx.fillRect(px + 3, py + 3, tile - 6, tile - 6);
      }
    }
  }
}


  function drawBall(playerFloat) {

    const r = Math.max(10, tile * 0.24);

    const c = cellCenter(playerFloat.x, playerFloat.y);



    // shadow

    ctx.fillStyle = "rgba(0,0,0,0.25)";

    ctx.beginPath();

    ctx.ellipse(c.cx + 2, c.cy + 5, r * 1.05, r * 0.85, 0, 0, Math.PI * 2);

    ctx.fill();



    // ball

    ctx.fillStyle = "#25d7ff";

    ctx.beginPath();

    ctx.arc(c.cx, c.cy, r, 0, Math.PI * 2);

    ctx.fill();



    // highlight

    ctx.fillStyle = "rgba(255,255,255,0.55)";

    ctx.beginPath();

    ctx.arc(c.cx - r * 0.3, c.cy - r * 0.35, r * 0.38, 0, Math.PI * 2);

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