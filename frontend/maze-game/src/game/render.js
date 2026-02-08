// src/game/render.js

const trenchTexture = new Image();
trenchTexture.src = "/textures/trench_noise.png";

const liquidTexture = new Image();
liquidTexture.src = "/textures/liquid_noise.png";

let trenchPattern = null;
let liquidPattern = null;

function ensurePatterns() {
  if (!trenchPattern && trenchTexture.complete) {
    trenchPattern = ctx.createPattern(trenchTexture, "repeat");
  }
  if (!liquidPattern && liquidTexture.complete) {
    liquidPattern = ctx.createPattern(liquidTexture, "repeat");
  }
}

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
  ctx.clearRect(0, 0, w, h);
  ensurePatterns();

  const depth = Math.max(6, tile * 0.3);

  // ─────────────────────────────
  // PASS 1: DEEP TRENCH (TEXTURED)
  // ─────────────────────────────
  ctx.fillStyle = "#081423"; // base darkness

  for (let y = 0; y < state.rows; y++) {
    for (let x = 0; x < state.cols; x++) {
      if (state.grid[y][x] === 1) continue;

      const px = ox + x * tile;
      const py = oy + y * tile;

      ctx.fillRect(px, py, tile, tile);

      if (x < state.cols - 1 && state.grid[y][x + 1] === 0) {
        ctx.fillRect(px + tile - 1, py, 2, tile);
      }
      if (y < state.rows - 1 && state.grid[y + 1][x] === 0) {
        ctx.fillRect(px, py + tile - 1, tile, 2);
      }
    }
  }

  // ─────────────────────────────
  // PASS 2: TRENCH NOISE (DEPTH)
  // ─────────────────────────────
  if (trenchPattern) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = trenchPattern;
    ctx.fillRect(ox, oy, state.cols * tile, state.rows * tile);
    ctx.globalAlpha = 1;
  }

  // ─────────────────────────────
  // PASS 3: INNER SHADOWS (ENGRAVED)
  // ─────────────────────────────
  for (let y = 0; y < state.rows; y++) {
    for (let x = 0; x < state.cols; x++) {
      if (state.grid[y][x] === 1) continue;

      const px = ox + x * tile;
      const py = oy + y * tile;

      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(px, py, tile, depth * 0.35);
      ctx.fillRect(px, py, depth * 0.35, tile);

      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(px, py + tile - depth * 0.25, tile, depth * 0.25);
      ctx.fillRect(px + tile - depth * 0.25, py, depth * 0.25, tile);
    }
  }

  // ─────────────────────────────
  // PASS 4: LIQUID PATH
  // ─────────────────────────────
  for (let y = 0; y < state.rows; y++) {
    for (let x = 0; x < state.cols; x++) {
      if (!state.isPainted(x, y)) continue;

      const px = ox + x * tile;
      const py = oy + y * tile;

      // liquid gradient
      const grad = ctx.createLinearGradient(py, py, py, py + tile);
      grad.addColorStop(0, "#3de8ff");
      grad.addColorStop(0.5, "#25d7ff");
      grad.addColorStop(1, "#0a7aa6");

      ctx.fillStyle = grad;
      ctx.fillRect(
        px + depth * 0.2,
        py + depth * 0.2,
        tile - depth * 0.4,
        tile - depth * 0.4
      );

      // liquid texture
      if (liquidPattern) {
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = liquidPattern;
        ctx.fillRect(px, py, tile, tile);
        ctx.globalAlpha = 1;
      }

      // gloss line
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(
        px + depth * 0.35,
        py + depth * 0.35,
        tile - depth * 0.7,
        depth * 0.18
      );
    }
  }

}
  function drawBall(playerFloat) {
  const r = Math.max(10, tile * 0.26);
  const c = cellCenter(playerFloat.x, playerFloat.y);

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(c.cx + 2, c.cy + 6, r * 1.1, r * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // gold gradient
  const grad = ctx.createRadialGradient(
    c.cx - r * 0.3,
    c.cy - r * 0.4,
    r * 0.2,
    c.cx,
    c.cy,
    r
  );

  grad.addColorStop(0, "#fff6c0");
  grad.addColorStop(0.4, "#ffd34d");
  grad.addColorStop(0.7, "#d4a017");
  grad.addColorStop(1, "#8b6508");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(c.cx, c.cy, r, 0, Math.PI * 2);
  ctx.fill();

  // sharp highlight
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.arc(c.cx - r * 0.35, c.cy - r * 0.45, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
}



  return { resize, render };

}