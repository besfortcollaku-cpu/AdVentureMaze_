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
const pathImgs = {};
const pathReady = {};

const PATH_NAMES = [
  "h_top",
  "h_bottom",
  "v_left",
  "v_right",
  "corner_tr",
  "corner_tl",
  "corner_br",
  "corner_bl",
  "cap_up",
  "cap_down",
  "cap_left",
  "cap_right",
  "tee_up",
  "tee_down",
  "tee_left",
  "tee_right",
  "cross"
];
for (const name of PATH_NAMES) {
  pathImgs[name] = new Image();
  pathReady[name] = false;
  pathImgs[name].onload = () => (pathReady[name] = true);
}


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

  const pathBase = base + "path/";

  for (const name of PATH_NAMES) {
    pathReady[name] = false;
    pathImgs[name].src = pathBase + name + ".png";
  }
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
  

function buildPathShape() {
  const r = tile * 0.38;

  ctx.beginPath();

  for (let y = 0; y < state.grid.length; y++) {
    for (let x = 0; x < state.grid[y].length; x++) {
      if (state.grid[y][x] === 1) continue;

      const cx = ox + x * tile + tile / 2;
      const cy = oy + y * tile + tile / 2;

      ctx.moveTo(cx + r, cy);
      ctx.arc(cx, cy, r, 0, Math.PI * 2);

      if (x < state.cols - 1 && state.grid[y][x + 1] !== 1) {
        ctx.rect(cx, cy - r, tile, r * 2);
      }

      if (y < state.rows - 1 && state.grid[y + 1][x] !== 1) {
        ctx.rect(cx - r, cy, r * 2, tile);
      }
    }
  }
}

function drawEngravedMaze() {
  const boardW = state.cols * tile;
  const boardH = state.rows * tile;

  ctx.save();

  buildPathShape();
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fill();

  buildPathShape();
  ctx.clip();

  const shadow = ctx.createRadialGradient(
    ox + boardW * 0.5,
    oy + boardH * 0.45,
    tile * 0.2,
    ox + boardW * 0.5,
    oy + boardH * 0.5,
    boardW
  );

  shadow.addColorStop(0, "rgba(0,0,0,0)");
  shadow.addColorStop(0.7, "rgba(0,0,0,0.12)");
  shadow.addColorStop(1, "rgba(0,0,0,0.25)");

  ctx.fillStyle = shadow;
  ctx.fillRect(ox, oy, boardW, boardH);

  const topLight = ctx.createLinearGradient(0, oy, 0, oy + tile);
  topLight.addColorStop(0, "rgba(255,255,255,0.15)");
  topLight.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = topLight;
  ctx.fillRect(ox, oy, boardW, boardH);

  const bottomShadow = ctx.createLinearGradient(
    0,
    oy + boardH - tile,
    0,
    oy + boardH
  );

  bottomShadow.addColorStop(0, "rgba(0,0,0,0)");
  bottomShadow.addColorStop(1, "rgba(0,0,0,0.28)");

  ctx.fillStyle = bottomShadow;
  ctx.fillRect(ox, oy, boardW, boardH);

  ctx.restore();
}
function isPath(x, y) {
  if (x < 0 || y < 0 || x >= state.cols || y >= state.rows) return false;
  return state.grid[y][x] === 1;
}

function getPathSpriteName(x, y) {
  const up = isPath(x, y - 1);
  const down = isPath(x, y + 1);
  const left = isPath(x - 1, y);
  const right = isPath(x + 1, y);

  const count = [up, down, left, right].filter(Boolean).length;

  if (count === 4) return "cross";

  if (count === 3) {
    if (!up) return "tee_up";
    if (!down) return "tee_down";
    if (!left) return "tee_left";
    if (!right) return "tee_right";
  }

  if (count === 2) {
    // straight horizontal
    if (left && right) {
      return down ? "h_top" : "h_bottom";
    }

    // straight vertical
    if (up && down) {
      return right ? "v_left" : "v_right";
    }

    // corners: named by OUTSIDE stone corner
    if (right && down) return "corner_tl";
    if (left && down) return "corner_tr";
    if (right && up) return "corner_bl";
    if (left && up) return "corner_br";
  }

  if (count === 1) {
    if (up) return "cap_up";
    if (down) return "cap_down";
    if (left) return "cap_left";
    if (right) return "cap_right";
  }

  return "cross";
}

  if (count === 2) {
    if (left && right) {
      return up ? "h_top" : "h_bottom";
    }

    if (up && down) {
      return left ? "v_left" : "v_right";
    }

    if (up && right) return "corner_tr";
    if (up && left) return "corner_tl";
    if (down && right) return "corner_br";
    if (down && left) return "corner_bl";
  }

  if (count === 1) {
    if (up) return "cap_up";
    if (down) return "cap_down";
    if (left) return "cap_left";
    if (right) return "cap_right";
  }

  return "cross";
}
function drawFloor() {
  for (let y = 0; y < state.rows; y++) {
    for (let x = 0; x < state.cols; x++) {
      if (state.grid[y][x] === 1) continue;

      const px = ox + x * tile;
      const py = oy + y * tile;

      const spriteName = getPathSpriteName(x, y);
      const img = pathImgs[spriteName];

      if (img && pathReady[spriteName]) {
        ctx.drawImage(img, px, py, tile, tile);
      } else {
        // fallback if image not loaded yet
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(px, py, tile, tile);
      }
    }
  }

  if (contactFlash) {
    const age = performance.now() - contactFlash.time;

    if (age < 220) {
      const cx = ox + contactFlash.x * tile + tile / 2;
      const cy = oy + contactFlash.y * tile + tile / 2;

      const theme = getTheme();
      let color = "rgba(160,220,255,";
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
function drawBackground() {
  // keep canvas transparent so page background shows through
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // subtle vignette only
  const g = ctx.createRadialGradient(
    w * 0.5,
    h * 0.45,
    h * 0.08,
    w * 0.5,
    h * 0.5,
    h * 0.75
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.12)");

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

  function render(playerFloat) {
  drawBackground();
  drawFloor();
  drawBall(playerFloat);
}


  return { resize, render };
}