import "./style.css";

/**
 * Adventure Maze — Level 242 vibe
 * - Wood board background
 * - Dark "pit/hole" recessed area
 * - Connected path strip (no gaps)
 * - Smooth movement (slide animation)
 * - Mobile swipe controls
 */

const app = document.querySelector("#app");

// Put your logo here:
// frontend/maze-game/public/logo.png
app.innerHTML = `
  <div class="phone">
    <div class="topbar">
      <div class="brand">
        <div class="logoBox" title="Adventure Maze">
          <img src="/logo.png" alt="Adventure Maze Logo" />
        </div>
      </div>

      <div class="levelWrap">
        <div class="levelNew">NEW!</div>
        <div class="levelText">LEVEL 242</div>
      </div>

      <div class="coins" title="Coins">
        <div class="coinDot"></div>
        <div id="coinCount">1888</div>
      </div>
    </div>

    <div class="boardWrap">
      <div class="boardFrame">
        <canvas id="game"></canvas>
      </div>
    </div>

    <div class="bottomBar">
      <button class="btn" id="hintBtn">
        <div class="btnIcon">🎬</div>
        <div>HINT</div>
      </button>

      <div class="pill">Swipe to move</div>

      <button class="btn" id="x3Btn">
        <div class="btnIcon">⏩</div>
        <div>×3</div>
      </button>
    </div>
  </div>

  <div class="desktopBlock" id="desktopBlock">
    <div class="desktopCard">
      <h2>Mobile game</h2>
      <p>This game is designed for smartphones. Use swipe on mobile. Desktop is only for testing (arrow keys).</p>
    </div>
  </div>
`;

/* ------------------ Device helpers ------------------ */
function isTouchDevice() {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}
function isNarrow() {
  return window.matchMedia("(max-width: 700px)").matches;
}
const desktopBlock = document.getElementById("desktopBlock");
function updateDesktopOverlay() {
  const show = !isTouchDevice() && !isNarrow();
  desktopBlock.style.display = show ? "flex" : "none";
}
updateDesktopOverlay();
window.addEventListener("resize", updateDesktopOverlay);

/* ------------------ Canvas setup ------------------ */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let tile = 40;
let boardW = 0;
let boardH = 0;
let ox = 0;
let oy = 0;

/* ------------------ Level data ------------------ */
/**
 * 0 = track
 * 1 = pit/void
 * 2 = goal (track)
 *
 * Track is a strip through a hole area (like Level 242).
 */
const grid = [
  [1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,0,1],
  [1,0,1,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,1,0,1],
  [1,1,1,1,1,1,0,1,0,1],
  [1,0,0,0,0,1,0,0,0,1],
  [1,0,1,1,0,1,1,1,2,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1],
];

const rows = grid.length;
const cols = grid[0].length;

const start = { x: 1, y: 1 };
let playerCell = { x: start.x, y: start.y };

const goal = findGoal();
function findGoal() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] === 2) return { x, y };
    }
  }
  return { x: cols - 2, y: rows - 2 };
}

function isTrack(x, y) {
  return grid[y] && (grid[y][x] === 0 || grid[y][x] === 2);
}

/* ------------------ Smooth movement ------------------ */
let moving = false;
let moveQueue = [];
let anim = {
  t0: 0,
  dur: 130, // ms
  sx: start.x,
  sy: start.y,
  tx: start.x,
  ty: start.y,
};

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function requestMove(dx, dy) {
  // queue moves while moving
  if (moving) {
    moveQueue.push({ dx, dy });
    if (moveQueue.length > 3) moveQueue.shift();
    return;
  }

  const nx = playerCell.x + dx;
  const ny = playerCell.y + dy;
  if (!isTrack(nx, ny)) return;

  moving = true;

  anim.t0 = performance.now();
  anim.sx = playerCell.x;
  anim.sy = playerCell.y;
  anim.tx = nx;
  anim.ty = ny;

  // update logical cell immediately (so goal check correct at end)
  playerCell.x = nx;
  playerCell.y = ny;
}

/* After movement ends, pop next queued move */
function onMoveFinished() {
  moving = false;

  if (playerCell.x === goal.x && playerCell.y === goal.y) {
    setTimeout(() => alert("LEVEL COMPLETE!"), 60);
  }

  if (moveQueue.length > 0) {
    const m = moveQueue.shift();
    requestMove(m.dx, m.dy);
  }
}

/* Desktop keys (testing only) */
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") requestMove(0, -1);
  if (e.key === "ArrowDown") requestMove(0, 1);
  if (e.key === "ArrowLeft") requestMove(-1, 0);
  if (e.key === "ArrowRight") requestMove(1, 0);
});

/* Swipe controls */
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
}, { passive: true });

canvas.addEventListener("touchend", (e) => {
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;

  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (Math.max(ax, ay) < 14) return;

  if (ax > ay) requestMove(dx > 0 ? 1 : -1, 0);
  else requestMove(0, dy > 0 ? 1 : -1);
}, { passive: true });

/* Buttons (UI only for now) */
document.getElementById("hintBtn").addEventListener("click", () => alert("Hint later 😉"));
document.getElementById("x3Btn").addEventListener("click", () => alert("Boost later 😉"));

/* ------------------ Resize ------------------ */
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  boardW = rect.width;
  boardH = rect.height;

  tile = Math.floor(Math.min(boardW / cols, boardH / rows));
  ox = Math.floor((boardW - cols * tile) / 2);
  oy = Math.floor((boardH - rows * tile) / 2);
}
window.addEventListener("resize", resizeCanvas);

/* ------------------ Drawing helpers ------------------ */
function roundRect(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function cellCenter(x, y) {
  return {
    cx: ox + x * tile + tile / 2,
    cy: oy + y * tile + tile / 2
  };
}

/* --- Wood background like Level 242 --- */
function drawWoodBackground() {
  // base
  const g = ctx.createLinearGradient(0, 0, 0, boardH);
  g.addColorStop(0, "#f0b77d");
  g.addColorStop(1, "#d89255");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, boardW, boardH);

  // subtle planks
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 10; i++) {
    const y = (boardH / 10) * i;
    ctx.fillStyle = i % 2 === 0 ? "#8a4f22" : "#6f3d18";
    ctx.fillRect(0, y, boardW, 2);
  }
  ctx.globalAlpha = 1;

  // wood grain curves (simple)
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 14; i++) {
    const x = (boardW / 14) * i + 10;
    ctx.beginPath();
    ctx.ellipse(x, boardH * 0.5, 18, boardH * 0.35, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "#5d2e12";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/* --- Pit (hole) for void cells --- */
function drawPit() {
  // Draw a big dark area behind, then carve edges per cell to look recessed.
  const pitPad = tile * 0.12;

  // overall pit glow/ambient
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = "#2a1b12";
  ctx.fillRect(ox, oy, cols * tile, rows * tile);
  ctx.restore();

  // Per void-cell: recessed rounded square + shadow
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] !== 1) continue;

      const px = ox + x * tile + pitPad;
      const py = oy + y * tile + pitPad;
      const pw = tile - pitPad * 2;
      const ph = tile - pitPad * 2;
      const r = Math.max(10, Math.floor(tile * 0.22));

      // shadow
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = "#1b100b";
      roundRect(px, py, pw, ph, r);
      ctx.fill();
      ctx.restore();

      // inner darker center (depth)
      const gg = ctx.createRadialGradient(px + pw*0.35, py + ph*0.25, 4, px + pw/2, py + ph/2, pw);
      gg.addColorStop(0, "#2b1a12");
      gg.addColorStop(1, "#120a07");
      ctx.fillStyle = gg;
      roundRect(px, py, pw, ph, r);
      ctx.fill();

      // top highlight edge
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = "#6a3b1f";
      ctx.lineWidth = 2;
      roundRect(px + 1, py + 1, pw - 2, ph - 2, r);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}

/* --- Wooden blocks (obstacles) inside pit like Level 242 --- */
const woodBlocks = [
  { x: 4, y: 4, w: 1, h: 1 },
  { x: 6, y: 6, w: 2, h: 1 },
  { x: 3, y: 7, w: 1, h: 1 },
];

function drawWoodBlock(rect) {
  // rect in grid coords
  const pad = tile * 0.12;
  const x = ox + rect.x * tile + pad;
  const y = oy + rect.y * tile + pad;
  const w = rect.w * tile - pad * 2;
  const h = rect.h * tile - pad * 2;
  const r = Math.max(12, Math.floor(tile * 0.25));

  // shadow
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.40)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = "#000";
  roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.restore();

  // wood gradient
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, "#f3bf7f");
  g.addColorStop(1, "#d08a4c");

  roundRect(x, y, w, h, r);
  ctx.fillStyle = g;
  ctx.fill();

  // wood lines
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "#7a3e15";
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const yy = y + (h / 5) * (i + 1);
    ctx.beginPath();
    ctx.moveTo(x + 10, yy);
    ctx.lineTo(x + w - 10, yy);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // top edge highlight
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "#fff2d8";
  ctx.lineWidth = 3;
  roundRect(x + 2, y + 2, w - 4, h - 4, r);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/* --- Track strip (connected, no gaps) --- */
function drawTrack() {
  const thick = tile * 0.78;
  const half = thick / 2;
  const rad = Math.max(12, Math.floor(thick * 0.28));
  const overlap = 1.4; // kills seams

  // track "tile" color like Level 242 (light purple)
  const trackGrad = ctx.createLinearGradient(0, oy, 0, oy + rows * tile);
  trackGrad.addColorStop(0, "#e9d6ff");
  trackGrad.addColorStop(1, "#cbb2ff");

  // glow around track a bit
  function glowStroke(pathFn) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 10;
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    pathFn();
    ctx.stroke();

    ctx.globalAlpha = 0.12;
    ctx.lineWidth = 14;
    ctx.strokeStyle = "rgba(37,215,255,0.55)";
    pathFn();
    ctx.stroke();
    ctx.restore();
  }

  function fillTrack(pathFn) {
    ctx.save();
    ctx.fillStyle = trackGrad;
    pathFn();
    ctx.fill();

    // slight top highlight
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = "#ffffff";
    pathFn(true);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // draw per track cell + connectors
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!isTrack(x, y)) continue;

      const { cx, cy } = cellCenter(x, y);

      const nodePath = () => roundRect(cx - half, cy - half, thick, thick, rad);
      glowStroke(nodePath);
      fillTrack(nodePath);

      const neighbors = {
        up: isTrack(x, y - 1),
        down: isTrack(x, y + 1),
        left: isTrack(x - 1, y),
        right: isTrack(x + 1, y),
      };

      if (neighbors.up) {
        const p = () => roundRect(cx - half, cy - tile / 2 - overlap, thick, tile / 2 + overlap, rad);
        glowStroke(p); fillTrack(p);
      }
      if (neighbors.down) {
        const p = () => roundRect(cx - half, cy, thick, tile / 2 + overlap, rad);
        glowStroke(p); fillTrack(p);
      }
      if (neighbors.left) {
        const p = () => roundRect(cx - tile / 2 - overlap, cy - half, tile / 2 + overlap, thick, rad);
        glowStroke(p); fillTrack(p);
      }
      if (neighbors.right) {
        const p = () => roundRect(cx, cy - half, tile / 2 + overlap, thick, rad);
        glowStroke(p); fillTrack(p);
      }
    }
  }

  // start ring
  const s = cellCenter(start.x, start.y);
  drawStartRing(s.cx, s.cy, tile * 0.22);

  // goal socket
  const g = cellCenter(goal.x, goal.y);
  drawGoalSocket(g.cx, g.cy, tile * 0.22);
}

function drawStartRing(cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.18, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(37,215,255,.65)";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.restore();
}

function drawGoalSocket(cx, cy, r) {
  ctx.save();
  // shadow
  ctx.beginPath();
  ctx.arc(cx + 2, cy + 3, r * 1.25, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fill();

  // gold
  const gg = ctx.createRadialGradient(cx - r*0.35, cy - r*0.35, r*0.2, cx, cy, r*1.25);
  gg.addColorStop(0, "#fff6c2");
  gg.addColorStop(0.55, "#ffcc33");
  gg.addColorStop(1, "#b67a00");

  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.08, 0, Math.PI * 2);
  ctx.fillStyle = gg;
  ctx.fill();

  // inner hole
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fill();

  ctx.restore();
}

/* --- Player (gold ball) --- */
function drawPlayer(px, py) {
  const r = tile * 0.22;

  // shadow
  ctx.beginPath();
  ctx.arc(px + 2, py + 4, r * 1.08, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fill();

  const g = ctx.createRadialGradient(px - r*0.35, py - r*0.35, r*0.2, px, py, r);
  g.addColorStop(0, "#fff6c2");
  g.addColorStop(0.55, "#ffcc33");
  g.addColorStop(1, "#c98700");

  ctx.beginPath();
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();

  // cyan rim glow (matches logo)
  ctx.globalAlpha = 0.20;
  ctx.beginPath();
  ctx.arc(px, py, r * 1.18, 0, Math.PI * 2);
  ctx.strokeStyle = "#25d7ff";
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/* ------------------ Main render ------------------ */
function getAnimatedPlayerPixel(now) {
  // If not moving, just return center of playerCell
  if (!moving) {
    const c = cellCenter(playerCell.x, playerCell.y);
    return { px: c.cx, py: c.cy };
  }

  const t = (now - anim.t0) / anim.dur;
  const k = easeOutCubic(Math.min(1, Math.max(0, t)));

  const sx = anim.sx + (anim.tx - anim.sx) * k;
  const sy = anim.sy + (anim.ty - anim.sy) * k;

  const c = cellCenter(sx, sy);
  return { px: c.cx, py: c.cy, done: t >= 1 };
}

function draw(now) {
  ctx.clearRect(0, 0, boardW, boardH);

  // 1) wood board
  drawWoodBackground();

  // 2) pit area
  drawPit();

  // 3) wooden blocks
  for (const b of woodBlocks) drawWoodBlock(b);

  // 4) track strip
  drawTrack();

  // 5) player (animated)
  const p = getAnimatedPlayerPixel(now);
  drawPlayer(p.px, p.py);

  if (moving && p.done) {
    onMoveFinished();
  }
}

/* ------------------ Game loop ------------------ */
function loop(now) {
  draw(now);
  requestAnimationFrame(loop);
}

/* init */
resizeCanvas();
requestAnimationFrame(loop);