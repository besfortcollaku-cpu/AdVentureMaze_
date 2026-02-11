

export function createRenderer({ canvas, state }) {
    let lastBallX = null;
    let lastBallY = null;
    const trail = [];
const MAX_TRAIL = 30;
  if (!(canvas instanceof HTMLCanvasElement)) {
    console.error("Renderer: canvas missing");
    return;
  }

  const ctx = canvas.getContext("2d");
  
 let shakeTime = 0;      // more frames
 let shakeStrength = 0;
 let shakeX = 0;
 let shakeY = 0;
 state.onMoveFinished = () => {
       console.log("SHAKE TRIGGERED");
  shakeTime = 12;       // duration in frames
  shakeStrength = 6;   // pixels
};

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
  // FLOOR TILE (PAINTED / DONE)
const floorDoneImg = new Image();
let floorDoneReady = false;
floorDoneImg.onload = () => (floorDoneReady = true);
floorDoneImg.src = "/textures/sprites/crystal/crystal_floor_done.png";
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

      // base fallback
      ctx.fillStyle = "#0f1c33";
      ctx.fillRect(px, py, tile, tile);

      // choose image based on path state
      if (state.isPainted(x, y)) {
        // 🔹 PATH COMPLETED TILE
        if (floorDoneReady) {
          ctx.drawImage(floorDoneImg, px, py, tile, tile);
        } else if (floorReady) {
          ctx.drawImage(floorImg, px, py, tile, tile);
        }
      } else {
        // 🔹 NORMAL TILE
        if (floorReady) {
          ctx.drawImage(floorImg, px, py, tile, tile);
          // ── CRYSTAL SUBSURFACE LIGHT (cheap + elegant)
const t = performance.now() * 0.001;
const pulse = 0.5 + Math.sin(t + x * 0.8 + y * 0.6) * 0.5;

ctx.fillStyle = `rgba(120,200,255,${0.06 + pulse * 0.04})`;
ctx.fillRect(
  px + tile * 0.18,
  py + tile * 0.18,
  tile * 0.64,
  tile * 0.64
);
// ── CRYSTAL FRACTURE LINES (static, elegant)
ctx.save();
ctx.globalAlpha = 0.18;
ctx.strokeStyle = "rgba(220,240,255,0.8)";
ctx.lineWidth = 1;

ctx.beginPath();

// pseudo-random but stable per tile
const seed = (x * 928371 + y * 123457) % 1000;
const fx = px + tile * (0.2 + (seed % 7) * 0.08);
const fy = py + tile * (0.2 + ((seed >> 3) % 7) * 0.08);

ctx.moveTo(fx, fy);
ctx.lineTo(
  fx + tile * (0.25 + ((seed >> 1) % 5) * 0.08),
  fy + tile * (0.15 + ((seed >> 2) % 5) * 0.08)
);

ctx.stroke();
ctx.restore();
        }
      }
    }
  }
}
function drawCrystalShard(x, y, angle, size, alpha, hueShift = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.globalAlpha = alpha;

  ctx.fillStyle = `hsl(${195 + hueShift}, 85%, 70%)`;

  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.6, 0);
  ctx.lineTo(0, size);
  ctx.lineTo(-size * 0.6, 0);
  ctx.closePath();

  ctx.fill();
  ctx.restore();
}


  function drawBall(playerFloat) {
  const size = tile * 0.9;
  const r = size / 2;
  const c = cellCenter(playerFloat.x, playerFloat.y);

  // ─────────────────────────
  // DERIVE VELOCITY
  // ─────────────────────────
  let vx = 0;
  let vy = 0;

  if (lastBallX !== null && lastBallY !== null) {
    vx = c.cx - lastBallX;
    vy = c.cy - lastBallY;
  }

  lastBallX = c.cx;
  lastBallY = c.cy;

  const speed = Math.hypot(vx, vy);
  const len = speed || 1;
  const nx = vx / len;
  const ny = vy / len;

  // ─────────────────────────
  // STORE TRAIL POINTS
  // ─────────────────────────
  if (speed > 0.1) {
    trail.push({
      x: c.cx,
      y: c.cy,
      vx,
      vy,
      life: 1
    });
  }

  while (trail.length > MAX_TRAIL) {
    trail.shift();
  }
  // ─────────────────────────
// CAMERA SHAKE TRIGGER
// ─────────────────────────


  // ─────────────────────────
  // DRAW TRAIL (BEHIND BALL)
  // ─────────────────────────
  // ─────────────────────────
// CRYSTAL SHARD TRAIL
// ─────────────────────────
for (let i = 0; i < trail.length; i++) {
  const t = trail[i];
  const fade = i / trail.length;

  const angle = Math.atan2(t.vy, t.vx);
  const size = r * (0.18 + fade * 0.12);

  drawCrystalShard(
    t.x - t.vx * 0.25,
    t.y - t.vy * 0.25,
    angle,
    size,
    0.35 * fade,
    i * 4 // subtle color shift
  );
}

ctx.globalAlpha = 1;

  // ─────────────────────────
  // MOTION BLUR
  // ─────────────────────────
  if (speed > 0.02 && ballReady) {
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
  // CRYSTAL SPARKS
  // ─────────────────────────
  if (speed > 0.03) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (let i = 0; i < 4; i++) {
      const px = c.cx - nx * r * (1.2 + Math.random());
      const py = c.cy - ny * r * (1.2 + Math.random());

      const pr = r * (0.08 + Math.random() * 0.12);

      ctx.fillStyle = `rgba(120,220,255,${0.2 + Math.random() * 0.4})`;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
  
  
  function drawWalls() {
  const grid = state.grid;

  const WALL_W = tile;
  const WALL_H = tile * 1.5;

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] !== 1) continue;

      const px = ox + x * tile;
      const py = oy + y * tile;

      // ── SHADOW (FAST & SAFE)
      ctx.fillStyle = "rgba(0,0,0,0.85)";
      ctx.fillRect(
        px + tile * 0.65,
        py + tile * 0.65,
        tile,
        tile
      );

      // ── WALL SPRITE
      if (wallReady) {
        ctx.drawImage(
          wallImg,
          px,
          py + tile - WALL_H,
          WALL_W,
          WALL_H
        );
      }
    }
  }
}
window.addEventListener("resize", resize);
resize();

  function render(playerFloat) {
  ctx.clearRect(0, 0, w, h);

  // ── CAMERA SHAKE APPLY
  if (shakeTime > 0) {
    const sx = (Math.random() - 0.5) * shakeStrength;
    const sy = (Math.random() - 0.5) * shakeStrength;
    ctx.save();
    ctx.translate(sx, sy);
    shakeTime--;
  }

  drawBackground();
  drawFloor();
  drawBall(playerFloat);
  drawWallShadow();
  drawWalls();

  if (shakeTime > 0) {
    ctx.restore();
  }

  }

  return { resize, render };
}