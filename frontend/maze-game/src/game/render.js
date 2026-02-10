export function createRenderer({ canvas, state }) {
  if (!(canvas instanceof HTMLCanvasElement)) {
    console.error("Renderer: canvas missing");
    return;
  }

  const ctx = canvas.getContext("2d");

  // ======================
  // CONFIG
  // ======================
  let w = 0;
  let h = 0;
  let tile = 48;
  let ox = 0;
  let oy = 0;

  // FLOOR TILE
  const floorImg = new Image();
  let floorReady = false;
  floorImg.onload = () => (floorReady = true);
  floorImg.src = "/textures/sprites/crystal/crystal_floor.png";
// WALL TILE
const wallImg = new Image();
let wallReady = false;
wallImg.onload = () => (wallReady = true);
wallImg.src = "/textures/sprites/crystal/corner_bl.png";
// BALL SPRITE
const ballImg = new Image();
let ballReady = false;
ballImg.onload = () => (ballReady = true);
ballImg.src = "/textures/sprites/crystal/gold_ball.png";
  // ======================
  // RESIZE
  // ======================
  function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  w = rect.width;
  h = rect.height;

  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // ✅ SINGLE source of truth
  tile = Math.floor(
    Math.min(
      w / state.cols,
      h / state.rows
    )
  );

  ox = Math.floor((w - state.cols * tile) / 2);
  oy = Math.floor((h - state.rows * tile) / 2);
}
  // ======================
  // HELPERS
  // ======================
  function cellCenter(x, y) {
    return {
      cx: ox + x * tile + tile / 2,
      cy: oy + y * tile + tile / 2,
    };
  }

  // ======================
  // DRAW
  // ======================
  function drawBackground() {
    ctx.fillStyle = "#0e1430";
    ctx.fillRect(0, 0, w, h);
  }

  
function drawFloor() {
  const grid = state.grid;

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const px = ox + x * tile;
      const py = oy + y * tile;

      ctx.fillStyle = "#1b2b44";
      ctx.fillRect(px, py, tile, tile);

      if (floorReady) {
        ctx.drawImage(floorImg, px, py, tile, tile);
      }
    }
  }
}
  function drawBall(playerFloat) {
  const size = tile * 0.9;
  const r = size / 2;
  const c = cellCenter(playerFloat.x, playerFloat.y);

  const vx = playerFloat.vx || 0;
  const vy = playerFloat.vy || 0;
  const speed = Math.hypot(vx, vy);

  // normalize direction
  const len = speed || 1;
  const nx = vx / len;
  const ny = vy / len;

  // ─────────────────────────
  // MOTION BLUR (behind ball)
  // ─────────────────────────
  if (speed > 0.02) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.35, speed * 0.8);

    ctx.drawImage(
      ballImg,
      c.cx - r - nx * r * 0.8,
      c.cy - r - ny * r * 0.8,
      size,
      size
    );

    ctx.restore();
  }

  // ─────────────────────────
  // MAIN BALL
  // ─────────────────────────
  if (ballReady) {
    ctx.drawImage(
      ballImg,
      c.cx - r,
      c.cy - r,
      size,
      size
    );
  } else {
    // fallback circle
    ctx.fillStyle = "#ffd34d";
    ctx.beginPath();
    ctx.arc(c.cx, c.cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // ─────────────────────────
  // ROLLING LIGHT REFLECTION
  // ─────────────────────────
  const lx = c.cx - nx * r * 0.6;
  const ly = c.cy - ny * r * 0.6;

  const shine = ctx.createRadialGradient(
    lx, ly, r * 0.1,
    lx, ly, r * 0.9
  );

  shine.addColorStop(0, "rgba(255,255,255,0.85)");
  shine.addColorStop(0.4, "rgba(255,255,255,0.25)");
  shine.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = shine;
  ctx.beginPath();
  ctx.arc(c.cx, c.cy, r, 0, Math.PI * 2);
  ctx.fill();

  // ─────────────────────────
  // CRYSTAL PARTICLE TRAIL
  // (behind movement direction)
  // ─────────────────────────
  if (speed > 0.03) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (let i = 0; i < 4; i++) {
      const t = Math.random();
      const px = c.cx - nx * r * (1.2 + t) + (Math.random() - 0.5) * r * 0.6;
      const py = c.cy - ny * r * (1.2 + t) + (Math.random() - 0.5) * r * 0.6;

      const pr = r * (0.08 + Math.random() * 0.12);

      ctx.fillStyle = `rgba(120,220,255,${0.15 + Math.random() * 0.35})`;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
  
  
  function drawWalls() {
  const grid = state.grid;

  const WALL_W = tile;        // 64
  const WALL_H = tile * 1.5;  // 96

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] !== 1) continue;

      const px = ox + x * tile;
      const py = oy + y * tile;

      // draw wall so bottom sits on floor tile
      if (wallReady) {
        ctx.drawImage(
          wallImg,
          px,
          py + tile - WALL_H, // ⬅️ extend upward
          WALL_W,
          WALL_H
        );
      } else {
        // fallback block
        ctx.fillStyle = "rgba(100,160,255,0.9)";
        ctx.fillRect(
          px,
          py + tile - WALL_H,
          WALL_W,
          WALL_H
        );
      }
    }
  }
}
  function render(playerFloat) {
  ctx.clearRect(0, 0, w, h);

  drawBackground();
  drawFloor();     // or floor inside drawMaze if you kept it
    drawBall(playerFloat); // last = depth illusion

  drawWalls();     // tall objects
}

  return { resize, render };
}