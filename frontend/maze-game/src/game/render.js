import { getTheme, onThemeChange } from "../theme.js";

export function createRenderer({ canvas, state }) {
    let lastBallX = null;
let lastBallY = null;
let lastBallVX = 0;
let lastBallVY = 0;
    const trail = [];
    let lastCellX = null;
let lastCellY = null;

let contactFlash = null;
// { x, y, time }
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
 let deformTime = 0;
let deformNX = 0;
let deformNY = 0;
let bounceTime = 0;
let bounceX = 0;
let bounceY = 0;
state.onMoveFinished = () => {
  shakeTime = 12;
  shakeStrength = 6;

  const len = Math.hypot(lastBallVX, lastBallVY) || 1;
  deformNX = lastBallVX / len;
  deformNY = lastBallVY / len;
  deformTime = 120;

  // wall micro-bounce (opposite of movement)
  bounceX = -deformNX * 4;
  bounceY = -deformNY * 4;
  bounceTime = 80; // ms
};

  // ======================
  // CONFIG
  // ======================
  let w = 0;
  let h = 0;
  let tile = 48;
  let ox = 0;
  let oy = 0;


function applyThemeAssets() {
  const theme = getTheme();

  const base =
    theme === "forest"
      ? "/textures/themes/forest/"
      : theme === "lava"
      ? "/textures/themes/lava/"
      : "/textures/themes/ice/";

  floorReady = floorDoneReady = wallReady = ballReady = false;

  floorImg.src = base + "floor.png";
  floorDoneImg.src = base + "floor_done.png";
  wallImg.src = base + "";
  ballImg.src = base + "ball.png";
}
  // FLOOR TILE
  const floorImg = new Image();
  let floorReady = false;
  floorImg.onload = () => (floorReady = true);
 
  // FLOOR TILE (PAINTED / DONE)
  
const floorDoneImg = new Image();
let floorDoneReady = false;
floorDoneImg.onload = () => (floorDoneReady = true);
// WALL TILE

const wallImg = new Image();
let wallReady = false;
wallImg.onload = () => (wallReady = true);
// BALL SPRITE

const ballImg = new Image();
let ballReady = false;
ballImg.onload = () => (ballReady = true);
  applyThemeAssets();
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

  // ── board padding (visible gap around maze)
  const boardPadding = 0;

  // usable area inside canvas
  const usableW = w - boardPadding * 2;
  const usableH = h - boardPadding * 2;

  // base tile size (fit to usable area)
  const fitTile = Math.min(
    usableW / state.cols,
    usableH / state.rows
  );

  // enforce minimum board scale (85%)
  const minBoardScale = 0.85;
  const minTile =
    Math.min(usableW, usableH) *
    minBoardScale /
    Math.max(state.cols, state.rows);

  // final tile size
  tile = Math.floor(Math.max(fitTile, minTile));

  // center board inside padded area
  ox = Math.floor(
    boardPadding + (usableW - state.cols * tile) / 2
  );
  oy = Math.floor(
    boardPadding + (usableH - state.rows * tile) / 2
  );
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
  
function drawWallShadow(px, py) {
  ctx.save();

  ctx.filter = "blur(1px)";
  ctx.fillStyle = "rgba(0,0,0,0.15)";

  ctx.fillRect(
    px + tile * 0.01,  // right
    py - tile * 0.01,  // up (light from bottom-left)
    tile,
    tile
  );

  ctx.restore();
}
function drawEngravedTile(px, py, done = false) {
  const bevel = Math.max(2, tile * 0.12);

  // 1) Deep recessed base
  const base = ctx.createLinearGradient(px, py, px, py + tile);
  base.addColorStop(0, done ? "rgba(90,170,110,0.20)" : "rgba(70,90,70,0.18)");
  base.addColorStop(0.35, done ? "rgba(25,55,30,0.48)" : "rgba(15,20,15,0.50)");
  base.addColorStop(1, done ? "rgba(0,0,0,0.72)" : "rgba(0,0,0,0.78)");
  ctx.fillStyle = base;
  ctx.fillRect(px, py, tile, tile);

  // 2) Strong top-left bevel highlight
  const topGrad = ctx.createLinearGradient(px, py, px, py + bevel);
  topGrad.addColorStop(0, done ? "rgba(220,255,230,0.42)" : "rgba(255,255,255,0.30)");
  topGrad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = topGrad;
  ctx.fillRect(px, py, tile, bevel);

  const leftGrad = ctx.createLinearGradient(px, py, px + bevel, py);
  leftGrad.addColorStop(0, done ? "rgba(220,255,230,0.36)" : "rgba(255,255,255,0.24)");
  leftGrad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = leftGrad;
  ctx.fillRect(px, py, bevel, tile);

  // 3) Strong bottom-right shadow bevel
  const bottomGrad = ctx.createLinearGradient(px, py + tile - bevel, px, py + tile);
  bottomGrad.addColorStop(0, "rgba(0,0,0,0)");
  bottomGrad.addColorStop(1, done ? "rgba(0,20,10,0.55)" : "rgba(0,0,0,0.60)");
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(px, py + tile - bevel, tile, bevel);

  const rightGrad = ctx.createLinearGradient(px + tile - bevel, py, px + tile, py);
  rightGrad.addColorStop(0, "rgba(0,0,0,0)");
  rightGrad.addColorStop(1, done ? "rgba(0,20,10,0.50)" : "rgba(0,0,0,0.58)");
  ctx.fillStyle = rightGrad;
  ctx.fillRect(px + tile - bevel, py, bevel, tile);

  // 4) Soft inner cavity shadow
  const cavity = ctx.createRadialGradient(
    px + tile * 0.42,
    py + tile * 0.40,
    tile * 0.08,
    px + tile * 0.5,
    py + tile * 0.5,
    tile * 0.72
  );
  cavity.addColorStop(0, "rgba(0,0,0,0)");
  cavity.addColorStop(0.7, "rgba(0,0,0,0.10)");
  cavity.addColorStop(1, done ? "rgba(0,0,0,0.26)" : "rgba(0,0,0,0.34)");
  ctx.fillStyle = cavity;
  ctx.fillRect(px, py, tile, tile);

  // 5) Very subtle glossy rim to sell depth
  ctx.strokeStyle = done
    ? "rgba(210,255,225,0.18)"
    : "rgba(255,255,255,0.12)";
  ctx.lineWidth = Math.max(1, tile * 0.035);
  ctx.strokeRect(px + 1, py + 1, tile - 2, tile - 2);
}
function drawEngravedPath() {
  ctx.save();

  // build path shape
  buildPathShape();

  // base trench color
  ctx.fillStyle = "rgba(0,0,0,0.42)";
  ctx.fill();

  // clip so effects affect ONLY the path
  buildPathShape();
  ctx.clip();

  // top highlight
  const hi = ctx.createLinearGradient(0, oy, 0, oy + tile * 0.8);
  hi.addColorStop(0, "rgba(255,255,255,0.18)");
  hi.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hi;
  ctx.fillRect(ox, oy, state.cols * tile, state.rows * tile);

  // left highlight
  const hi2 = ctx.createLinearGradient(ox, 0, ox + tile * 0.8, 0);
  hi2.addColorStop(0, "rgba(255,255,255,0.12)");
  hi2.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hi2;
  ctx.fillRect(ox, oy, state.cols * tile, state.rows * tile);

  // bottom shadow
  const sh = ctx.createLinearGradient(
    0,
    oy + state.rows * tile - tile * 0.8,
    0,
    oy + state.rows * tile
  );
  sh.addColorStop(0, "rgba(0,0,0,0)");
  sh.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = sh;
  ctx.fillRect(ox, oy, state.cols * tile, state.rows * tile);

  // right shadow
  const sh2 = ctx.createLinearGradient(
    ox + state.cols * tile - tile * 0.8,
    0,
    ox + state.cols * tile,
    0
  );
  sh2.addColorStop(0, "rgba(0,0,0,0)");
  sh2.addColorStop(1, "rgba(0,0,0,0.28)");
  ctx.fillStyle = sh2;
  ctx.fillRect(ox, oy, state.cols * tile, state.rows * tile);

  ctx.restore();
}
function buildPathShape() {
  const r = tile * 0.34;

  ctx.beginPath();

  for (let y = 0; y < state.grid.length; y++) {
    for (let x = 0; x < state.grid[y].length; x++) {
      const cell = state.grid[y][x];
      if (cell === 1) continue;

      const px = ox + x * tile;
      const py = oy + y * tile;
      const cx = px + tile / 2;
      const cy = py + tile / 2;

      // round node
      ctx.moveTo(cx + r, cy);
      ctx.arc(cx, cy, r, 0, Math.PI * 2);

      // connect right
      if (x < state.grid[y].length - 1 && state.grid[y][x + 1] !== 1) {
        ctx.rect(cx, cy - r, tile, r * 2);
      }

      // connect down
      if (y < state.grid.length - 1 && state.grid[y + 1][x] !== 1) {
        ctx.rect(cx - r, cy, r * 2, tile);
      }
    }
  }
}

function drawEngravedPath() {
  ctx.save();

  // 1) trench base
  buildPathShape();
  const base = ctx.createLinearGradient(0, oy, 0, oy + state.rows * tile);
  base.addColorStop(0, "rgba(255,255,255,0.04)");
  base.addColorStop(0.25, "rgba(20,35,20,0.20)");
  base.addColorStop(1, "rgba(0,0,0,0.72)");
  ctx.fillStyle = base;
  ctx.fill();

  // 2) top-left bevel highlight
  buildPathShape();
  ctx.save();
  ctx.clip();
  const hiTop = ctx.createLinearGradient(0, oy, 0, oy + tile * 0.25);
  hiTop.addColorStop(0, "rgba(255,255,255,0.22)");
  hiTop.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hiTop;
  ctx.fillRect(ox, oy, state.cols * tile, tile * 0.35);

  const hiLeft = ctx.createLinearGradient(ox, 0, ox + tile * 0.25, 0);
  hiLeft.addColorStop(0, "rgba(255,255,255,0.18)");
  hiLeft.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hiLeft;
  ctx.fillRect(ox, oy, tile * 0.35, state.rows * tile);
  ctx.restore();

  // 3) bottom-right shadow bevel
  buildPathShape();
  ctx.save();
  ctx.clip();
  const shBot = ctx.createLinearGradient(
    0,
    oy + state.rows * tile - tile * 0.25,
    0,
    oy + state.rows * tile
  );
  shBot.addColorStop(0, "rgba(0,0,0,0)");
  shBot.addColorStop(1, "rgba(0,0,0,0.36)");
  ctx.fillStyle = shBot;
  ctx.fillRect(ox, oy, state.cols * tile, state.rows * tile);

  const shRight = ctx.createLinearGradient(
    ox + state.cols * tile - tile * 0.25,
    0,
    ox + state.cols * tile,
    0
  );
  shRight.addColorStop(0, "rgba(0,0,0,0)");
  shRight.addColorStop(1, "rgba(0,0,0,0.30)");
  ctx.fillStyle = shRight;
  ctx.fillRect(ox, oy, state.cols * tile, state.rows * tile);
  ctx.restore();

  // 4) inner cavity shadow
  buildPathShape();
  ctx.save();
  ctx.clip();
  const cavity = ctx.createRadialGradient(
    ox + state.cols * tile * 0.45,
    oy + state.rows * tile * 0.40,
    tile * 0.4,
    ox + state.cols * tile * 0.5,
    oy + state.rows * tile * 0.5,
    state.cols * tile * 0.7
  );
  cavity.addColorStop(0, "rgba(0,0,0,0)");
  cavity.addColorStop(1, "rgba(0,0,0,0.18)");
  ctx.fillStyle = cavity;
  ctx.fillRect(ox, oy, state.cols * tile, state.rows * tile);
  ctx.restore();

  ctx.restore();
}
function drawFloor() {
  drawEngravedPath();

  if (contactFlash) {
    const age = performance.now() - contactFlash.time;

    if (age < 220) {
      const cx = ox + contactFlash.x * tile + tile / 2;
      const cy = oy + contactFlash.y * tile + tile / 2;

      let color = "rgba(160,220,255,";
      const theme = getTheme();
      if (theme === "forest") color = "rgba(140,255,180,";
      else if (theme === "lava") color = "rgba(255,170,120,";

      const alpha = 0.35 * (1 - age / 220);

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `${color}${alpha})`;
      ctx.beginPath();
      ctx.arc(cx, cy, tile * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      contactFlash = null;
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
      const theme = getTheme();

  let glowHue = 195; // ice default (blue)
  let sparkColor = "rgba(120,220,255,";

  if (theme === "forest") {
    glowHue = 135; // green
    sparkColor = "rgba(120,255,180,";
  } else if (theme === "lava") {
    glowHue = 20; // orange-red
    sparkColor = "rgba(255,160,80,";
  }
  const size = tile * 0.9;
  const r = size / 2;
  const c = cellCenter(playerFloat.x, playerFloat.y);
let bx = 0;
let by = 0;

if (bounceTime > 0) {
  const t = bounceTime / 80;
  bx = bounceX * t;
  by = bounceY * t;
  bounceTime -= 16;
}
// ── CONTACT TILE DETECTION
const cellX = Math.floor(playerFloat.x);
const cellY = Math.floor(playerFloat.y);

if (cellX !== lastCellX || cellY !== lastCellY) {
  lastCellX = cellX;
  lastCellY = cellY;

  contactFlash = {
    x: cellX,
    y: cellY,
    time: performance.now()
  };
}
  // ─────────────────────────
  // DERIVE VELOCITY
  // ─────────────────────────
  let vx = 0;
  let vy = 0;

  if (lastBallX !== null && lastBallY !== null) {
    vx = c.cx - lastBallX;
    vy = c.cy - lastBallY;
  }
  lastBallVX = vx;
lastBallVY = vy;
const speed = Math.hypot(vx, vy);
const speedNorm = Math.min(1, speed / (tile * 0.5));

// stretch while moving
let scaleX = 1 + speedNorm * 0.22;
let scaleY = 1 - speedNorm * 0.16;

if (deformTime > 0) {
  const t = deformTime / 120;
  scaleX = 1 - t * 0.28;
  scaleY = 1 + t * 0.28;
  deformTime -= 16;
}

  lastBallX = c.cx;
  lastBallY = c.cy;

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
    i * 4 + (glowHue - 195)// subtle color shift
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
    ctx.save();

// apply deformation without rotation
const drawW = size * scaleX;
const drawH = size * scaleY;

ctx.drawImage(
  ballImg,
  c.cx - drawW / 2 + bx,
  c.cy - drawH / 2 + by,
  drawW,
  drawH
);

ctx.restore();

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

  shine.addColorStop(0, `hsla(${glowHue}, 100%, 90%, 0.85)`);
shine.addColorStop(0.4, `hsla(${glowHue}, 100%, 70%, 0.25)`);
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

      ctx.fillStyle = `${sparkColor}${0.2 + Math.random() * 0.4})`;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
  
  
  function drawWalls() {
  const grid = state.grid;
  const theme = getTheme();

  let glowColor = "rgba(0,0,0,0.55)";
  let glow2 = "rgba(0,0,0,0.35)";

  if (theme === "forest") {
    glowColor = "rgba(20,80,40,0.55)";
    glow2 = "rgba(20,80,40,0.35)";
  } else if (theme === "lava") {
    glowColor = "rgba(120,40,10,0.55)";
    glow2 = "rgba(120,40,10,0.35)";
  }

  const WALL_W = tile;
  const WALL_H = tile * 1.5;

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] !== 1) continue;

      const px = ox + x * tile;
      const py = oy + y * tile;

     // darkest core
  ctx.fillStyle = glowColor;
  ctx.fillRect(
    px + tile * 0.12,
    py - tile * 0.18,
    tile,
    tile
  );

  // soft spread 1
ctx.fillStyle = glow2;
ctx.fillRect(
    px + tile * 0.2,
    py - tile * 0.3,
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

  drawFloor();
  drawEngravedPath();
  drawBall(playerFloat);
  //drawWallShadow();
  //drawWalls();

  if (shakeTime > 0) {
    ctx.restore();
  }

  }
  onThemeChange(() => {
    applyThemeAssets();
  });


  return { resize, render };
}