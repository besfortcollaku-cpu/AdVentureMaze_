import "./style.css";

const app = document.querySelector("#app");

app.innerHTML = `
  <div class="topbar">
    <h1 class="title">Adventure Maze</h1>
    <div class="badge" id="status">Level 1</div>
  </div>
  <div class="panel">
    <canvas id="game" width="520" height="520"></canvas>
  </div>
`;

const statusEl = document.getElementById("status");
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

const pad = 22;              // hole padding
const gridSize = 8;          // 8x8 tiles like the screenshot vibe
const cell = Math.floor((W - pad * 2) / gridSize);
const boardPx = cell * gridSize;
const boardX = Math.floor((W - boardPx) / 2);
const boardY = Math.floor((H - boardPx) / 2);

// 0 = empty floor, 1 = wooden block (obstacle)
const LEVELS = [
  // Level 1 (similar-ish layout)
  [
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,0],
    [0,1,1,0,0,1,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,1,1,0,0,0,0],
    [0,0,0,0,0,1,0,0],
    [0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
  ],
];

let levelIndex = 0;
let map = clone2D(LEVELS[levelIndex]);

// painted tiles
let painted = make2D(gridSize, gridSize, 0);

// player (grid coords)
let player = { x: 0, y: 0, r: Math.floor(cell * 0.18) };

// place player on first free tile
placePlayer();

painted[player.y][player.x] = 1;

let moving = false;
let dir = { x: 0, y: 0 };
let lastMoveAt = 0;

// ---------- helpers ----------
function clone2D(arr) {
  return arr.map(row => row.slice());
}
function make2D(w, h, val) {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => val));
}
function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < gridSize && y < gridSize;
}
function isBlocked(x, y) {
  return !inBounds(x, y) || map[y][x] === 1;
}
function freeTileCount() {
  let n = 0;
  for (let y=0; y<gridSize; y++) for (let x=0; x<gridSize; x++) if (map[y][x] === 0) n++;
  return n;
}
function paintedCount() {
  let n = 0;
  for (let y=0; y<gridSize; y++) for (let x=0; x<gridSize; x++) if (painted[y][x] === 1) n++;
  return n;
}
function placePlayer() {
  for (let y=0; y<gridSize; y++) {
    for (let x=0; x<gridSize; x++) {
      if (map[y][x] === 0) {
        player.x = x; player.y = y;
        return;
      }
    }
  }
}

// ---------- “3D look” drawing ----------
function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHole() {
  // dark pit
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#3a241a");
  g.addColorStop(1, "#24140f");
  ctx.fillStyle = g;
  roundedRect(boardX - 10, boardY - 10, boardPx + 20, boardPx + 20, 18);
  ctx.fill();

  // vignette
  const v = ctx.createRadialGradient(W/2, H/2, 60, W/2, H/2, 380);
  v.addColorStop(0, "rgba(255,255,255,0.06)");
  v.addColorStop(1, "rgba(0,0,0,0.40)");
  ctx.fillStyle = v;
  roundedRect(boardX - 10, boardY - 10, boardPx + 20, boardPx + 20, 18);
  ctx.fill();
}

function drawPaintTile(x, y) {
  const px = boardX + x * cell;
  const py = boardY + y * cell;

  // tile shape
  const r = Math.floor(cell * 0.22);
  const inset = 5;

  // soft shadow
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = "#7b5cff";
  roundedRect(px + inset, py + inset, cell - inset*2, cell - inset*2, r);
  ctx.fill();
  ctx.restore();

  // gradient (purple glow)
  const g = ctx.createLinearGradient(px, py, px + cell, py + cell);
  g.addColorStop(0, "#c9b7ff");
  g.addColorStop(0.35, "#8b6bff");
  g.addColorStop(1, "#5b39ff");

  ctx.fillStyle = g;
  roundedRect(px + inset, py + inset, cell - inset*2, cell - inset*2, r);
  ctx.fill();

  // highlight edge
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  roundedRect(px + inset + 2, py + inset + 2, cell - inset*2 - 4, cell - inset*2 - 4, r - 2);
  ctx.stroke();
}

function drawBlock(x, y) {
  const px = boardX + x * cell;
  const py = boardY + y * cell;
  const r = Math.floor(cell * 0.22);
  const inset = 5;

  // shadow
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = "#c58b55";
  roundedRect(px + inset, py + inset, cell - inset*2, cell - inset*2, r);
  ctx.fill();
  ctx.restore();

  // top
  const g = ctx.createLinearGradient(px, py, px, py + cell);
  g.addColorStop(0, "#e5b27a");
  g.addColorStop(1, "#c78954");

  ctx.fillStyle = g;
  roundedRect(px + inset, py + inset, cell - inset*2, cell - inset*2, r);
  ctx.fill();

  // edge highlight
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  roundedRect(px + inset + 2, py + inset + 2, cell - inset*2 - 4, cell - inset*2 - 4, r - 2);
  ctx.stroke();
}

function drawBall(cx, cy, r) {
  // shadow under ball
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + r + 10, r * 1.0, r * 0.40, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // glossy gold
  const g = ctx.createRadialGradient(cx - r*0.35, cy - r*0.35, 2, cx, cy, r);
  g.addColorStop(0, "#fff6c8");
  g.addColorStop(0.35, "#ffd36a");
  g.addColorStop(1, "#b9781c");

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 10;

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  // shine
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.beginPath();
  ctx.arc(cx - r*0.35, cy - r*0.35, r*0.28, 0, Math.PI*2);
  ctx.fill();
}

// ---------- game loop ----------
function moveStep() {
  if (!moving) return;

  const now = performance.now();
  if (now - lastMoveAt < 85) return; // speed

  lastMoveAt = now;

  const nx = player.x + dir.x;
  const ny = player.y + dir.y;

  if (isBlocked(nx, ny)) {
    moving = false;
    return;
  }

  player.x = nx;
  player.y = ny;
  painted[ny][nx] = 1;

  // win when all free tiles painted
  if (paintedCount() >= freeTileCount()) {
    nextLevel();
  }
}

function nextLevel() {
  levelIndex = (levelIndex + 1) % LEVELS.length;
  map = clone2D(LEVELS[levelIndex]);
  painted = make2D(gridSize, gridSize, 0);
  placePlayer();
  painted[player.y][player.x] = 1;
  moving = false;
  dir = { x: 0, y: 0 };
}

function draw() {
  ctx.clearRect(0,0,W,H);

  drawHole();

  // painted path first
  for (let y=0; y<gridSize; y++) {
    for (let x=0; x<gridSize; x++) {
      if (painted[y][x] === 1) drawPaintTile(x, y);
    }
  }

  // blocks on top
  for (let y=0; y<gridSize; y++) {
    for (let x=0; x<gridSize; x++) {
      if (map[y][x] === 1) drawBlock(x, y);
    }
  }

  // ball
  const cx = boardX + player.x*cell + cell/2;
  const cy = boardY + player.y*cell + cell/2;
  drawBall(cx, cy, player.r);

  // status
  statusEl.textContent = `Level ${levelIndex + 1} • ${paintedCount()}/${freeTileCount()}`;
}

function loop() {
  moveStep();
  draw();
  requestAnimationFrame(loop);
}
loop();

// ---------- controls ----------
function setDir(dx, dy) {
  dir.x = dx; dir.y = dy;
  moving = !(dx === 0 && dy === 0);
}

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") setDir(0,-1);
  else if (e.key === "ArrowDown") setDir(0,1);
  else if (e.key === "ArrowLeft") setDir(-1,0);
  else if (e.key === "ArrowRight") setDir(1,0);
  else if (e.key === "r" || e.key === "R") { // reset
    painted = make2D(gridSize, gridSize, 0);
    placePlayer();
    painted[player.y][player.x] = 1;
    moving = false;
    dir = {x:0,y:0};
  }
});

window.addEventListener("keyup", (e) => {
  // stop when releasing arrow keys (optional)
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
    setDir(0,0);
  }
});

// Swipe controls (mobile)
let touchStart = null;

canvas.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  touchStart = { x: t.clientX, y: t.clientY };
}, { passive: true });

canvas.addEventListener("touchmove", (e) => {
  if (!touchStart) return;
  const t = e.touches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;

  const adx = Math.abs(dx);
  const ady = Math.abs(dy);

  if (adx < 18 && ady < 18) return;

  if (adx > ady) setDir(dx > 0 ? 1 : -1, 0);
  else setDir(0, dy > 0 ? 1 : -1);

  touchStart = { x: t.clientX, y: t.clientY };
}, { passive: true });

canvas.addEventListener("touchend", () => {
  touchStart = null;
  setDir(0,0);
}, { passive: true });
4

Besfort Çollaku
9:48 PM (6 minutes ago)
import "./style.css"; const app = document.querySelector("#app"); // UI numberslet uiLevelNumber = 242;let uiCoins = 1888; app.innerHTML = ` <div class="ui"> <d

Besfort Çollaku <besfort.collaku@gmail.com>
9:51 PM (2 minutes ago)
to me

import "./style.css";

const app = document.querySelector("#app");

// UI numbers
let uiLevelNumber = 242;
let uiCoins = 1888;

app.innerHTML = `
  <div class="ui">
    <div class="topRow">
      <div class="leftStack">
        <button class="iconBtn yellow" title="Settings">⚙️</button>
        <div style="position:relative">
          <button class="iconBtn gray" title="Claim">📅</button>
          <div class="claimTag">CLAIM!</div>
        </div>
      </div>

      <div class="levelText" id="uiLevel">LEVEL ${uiLevelNumber}</div>

      <div class="rightStack" style="justify-content:flex-end">
        <div class="coinPill" title="Coins">
          <div class="coin"></div>
          <div id="uiCoins">${uiCoins}</div>
        </div>
      </div>
    </div>

    <div class="smallRow">
      <button class="smallBtn purple" title="Joystick">🕹️</button>
      <button class="smallBtn pink" title="Brush"><span class="newTag">NEW!</span>🖌️</button>
      <button class="smallBtn yellow" title="Trophy">🏆</button>
      <button class="smallBtn purple" title="Skins">🟡</button>
      <button class="smallBtn yellow" title="No Ads">🚫</button>
    </div>

    <div class="stage">
      <canvas id="game" width="520" height="520"></canvas>
    </div>

    <div class="bottomRow">
      <button class="bigBtn hint" id="btnHint"><span class="film">▶</span>HINT</button>
      <button class="bigBtn x3" id="btnX3"><span class="film">▶</span>×3</button>
    </div>
  </div>
`;