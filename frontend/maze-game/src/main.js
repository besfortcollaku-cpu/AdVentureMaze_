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

document.getElementById("btnHint").addEventListener("click", () => alert("Hint soon 🙂"));
document.getElementById("btnX3").addEventListener("click", () => alert("x3 soon 🙂"));

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

const grid = 9; // little bigger looks nicer
const pad = 26;
const cell = Math.floor((W - pad * 2) / grid);
const boardPx = cell * grid;
const boardX = Math.floor((W - boardPx) / 2);
const boardY = Math.floor((H - boardPx) / 2);

// ---------- LEVEL DATA (walkable path + blocks) ----------
// 0 = hole/pit, 1 = path you can paint
function make2D(n, v) {
  return Array.from({ length: n }, () => Array.from({ length: n }, () => v));
}
function clone2D(a) {
  return a.map(r => r.slice());
}

function applyBlocksToMap(map, blocks) {
  for (const b of blocks) {
    for (let yy = b.y; yy < b.y + b.h; yy++) {
      for (let xx = b.x; xx < b.x + b.w; xx++) {
        if (yy >= 0 && yy < grid && xx >= 0 && xx < grid) map[yy][xx] = 0;
      }
    }
  }
}

function pathLevel242() {
  const path = make2D(grid, 0);

  // Make a "channel" similar to your screenshot: top long + left vertical + right pocket
  // Top row path
  for (let x = 0; x < 9; x++) path[1][x] = 1;

  // Left vertical down
  for (let y = 1; y < 7; y++) path[y][0] = 1;

  // Right pocket-ish channel
  for (let x = 3; x < 9; x++) path[2][x] = 1;
  for (let y = 2; y < 5; y++) path[y][8] = 1;

  // Bottom-ish turn
  for (let x = 0; x < 6; x++) path[6][x] = 1;
  for (let y = 4; y < 7; y++) path[y][5] = 1;

  // Blocks (wood blocks inside the pit) - different sizes
  const blocks = [
    { x: 3, y: 3, w: 1, h: 1 },
    { x: 2, y: 5, w: 1, h: 1 },
    { x: 5, y: 4, w: 2, h: 1 }, // 2x1
    { x: 6, y: 6, w: 3, h: 1 }, // 3x1
  ];

  // Blocks should remain pit area (0), so just keep them 0 (already 0 by default)
  applyBlocksToMap(path, blocks);

  return { path, blocks };
}

let level = pathLevel242();
let map = clone2D(level.path); // 1 = walkable, 0 = pit/blocked
let blocks = level.blocks;

// Painted tiles (only on walkable path)
let painted = make2D(grid, 0);

// ---------- PLAYER (smooth sliding) ----------
let player = {
  gx: 0, gy: 1, // grid pos
  px: 0, py: 0, // pixel pos (center)
  tx: 0, ty: 0, // target pixel pos
  r: Math.floor(cell * 0.18),
  moving: false,
  dirx: 0, diry: 0
};

function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < grid && y < grid;
}
function isWalkable(x, y) {
  return inBounds(x, y) && map[y][x] === 1;
}
function cellCenterX(x) { return boardX + x * cell + cell / 2; }
function cellCenterY(y) { return boardY + y * cell + cell / 2; }

function placePlayerOnFirstPath() {
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      if (map[y][x] === 1) {
        player.gx = x; player.gy = y;
        player.px = cellCenterX(x);
        player.py = cellCenterY(y);
        player.tx = player.px;
        player.ty = player.py;
        painted[y][x] = 1;
        return;
      }
    }
  }
}
placePlayerOnFirstPath();

function paintedCount() {
  let n = 0;
  for (let y = 0; y < grid; y++) for (let x = 0; x < grid; x++) if (painted[y][x] === 1) n++;
  return n;
}
function walkableCount() {
  let n = 0;
  for (let y = 0; y < grid; y++) for (let x = 0; x < grid; x++) if (map[y][x] === 1) n++;
  return n;
}

// ---------- DRAW HELPERS ----------
function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawWoodBoard() {
  // a wood "frame"
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#d8a26a");
  g.addColorStop(1, "#c48b55");
  ctx.fillStyle = g;
  roundedRect(boardX - 16, boardY - 16, boardPx + 32, boardPx + 32, 22);
  ctx.fill();

  // shine
  ctx.fillStyle = "rgba(255,255,255,0.09)";
  roundedRect(boardX - 16, boardY - 16, boardPx + 32, boardPx + 32, 22);
  ctx.fill();
}

function drawPitBackground() {
  // dark pit inside the wood
  const pit = ctx.createLinearGradient(0, boardY, 0, boardY + boardPx);
  pit.addColorStop(0, "#3a241a");
  pit.addColorStop(1, "#1d0f0b");
  ctx.fillStyle = pit;
  roundedRect(boardX, boardY, boardPx, boardPx, 18);
  ctx.fill();

  // vignette
  const v = ctx.createRadialGradient(W/2, H/2, 50, W/2, H/2, 420);
  v.addColorStop(0, "rgba(255,255,255,0.05)");
  v.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = v;
  roundedRect(boardX, boardY, boardPx, boardPx, 18);
  ctx.fill();
}

function drawPathTile(x, y) {
  const px = boardX + x * cell;
  const py = boardY + y * cell;
  const inset = 6;
  const r = Math.floor(cell * 0.23);

  // shadow depth (gives carved channel feel)
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 8;

  const g = ctx.createLinearGradient(px, py, px + cell, py + cell);
  g.addColorStop(0, "#eadfff");
  g.addColorStop(0.4, "#9d7cff");
  g.addColorStop(1, "#5b39ff");

  ctx.fillStyle = g;
  roundedRect(px + inset, py + inset, cell - inset * 2, cell - inset * 2, r);
  ctx.fill();
  ctx.restore();

  // highlight border
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  roundedRect(px + inset + 2, py + inset + 2, cell - inset * 2 - 4, cell - inset * 2 - 4, r - 2);
  ctx.stroke();
}

function drawWoodBlockRect(b) {
  const px = boardX + b.x * cell;
  const py = boardY + b.y * cell;
  const ww = b.w * cell;
  const hh = b.h * cell;

  const inset = 7;
  const r = 16;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.40)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 14;

  const g = ctx.createLinearGradient(px, py, px, py + hh);
  g.addColorStop(0, "#efc08b");
  g.addColorStop(1, "#c78954");

  ctx.fillStyle = g;
  roundedRect(px + inset, py + inset, ww - inset * 2, hh - inset * 2, r);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 2;
  roundedRect(px + inset + 2, py + inset + 2, ww - inset * 2 - 4, hh - inset * 2 - 4, r - 2);
  ctx.stroke();
}

function drawBall(cx, cy, r) {
  // shadow
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + r + 10, r * 1.05, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, 2, cx, cy, r);
  g.addColorStop(0, "#fff6c8");
  g.addColorStop(0.35, "#ffd36a");
  g.addColorStop(1, "#b9781c");

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 10;

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.beginPath();
  ctx.arc(cx - r * 0.35, cy - r * 0.35, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
}

// ---------- MOVEMENT (smooth) ----------
function setDir(dx, dy) {
  player.dirx = dx;
  player.diry = dy;
}

function tryStartMove() {
  if (player.moving) return;

  const nx = player.gx + player.dirx;
  const ny = player.gy + player.diry;

  if (!isWalkable(nx, ny)) return;

  player.gx = nx;
  player.gy = ny;

  player.tx = cellCenterX(nx);
  player.ty = cellCenterY(ny);

  player.moving = true;
}

function update(dt) {
  // If not moving, attempt to start (for held key / swipe)
  if (!player.moving && (player.dirx !== 0 || player.diry !== 0)) {
    tryStartMove();
  }

  if (player.moving) {
    const speed = 520; // px/sec
    const dx = player.tx - player.px;
    const dy = player.ty - player.py;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1) {
      player.px = player.tx;
      player.py = player.ty;
      player.moving = false;

      painted[player.gy][player.gx] = 1;

      // level complete
      if (paintedCount() >= walkableCount()) {
        uiLevelNumber++;
        uiCoins += 15;
        document.getElementById("uiLevel").textContent = `LEVEL ${uiLevelNumber}`;
        document.getElementById("uiCoins").textContent = `${uiCoins}`;

        painted = make2D(grid, 0);
        placePlayerOnFirstPath();
      }
      return;
    }

    const step = Math.min(dist, speed * dt);
    player.px += (dx / dist) * step;
    player.py += (dy / dist) * step;
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  drawWoodBoard();
  drawPitBackground();

  // draw ONLY the carved path tiles (looks like Level UI channels)
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      if (map[y][x] === 1) drawPathTile(x, y);
    }
  }

  // wooden blocks on top
  for (const b of blocks) drawWoodBlockRect(b);

  drawBall(player.px, player.py, player.r);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ---------- INPUT ----------
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") setDir(0, -1);
  if (e.key === "ArrowDown") setDir(0, 1);
  if (e.key === "ArrowLeft") setDir(-1, 0);
  if (e.key === "ArrowRight") setDir(1, 0);

  if (e.key === "r" || e.key === "R") {
    painted = make2D(grid, 0);
    placePlayerOnFirstPath();
  }
});

window.addEventListener("keyup", (e) => {
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) setDir(0, 0);
});

// Swipe (mobile)
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

  const adx = Math.abs(dx), ady = Math.abs(dy);
  if (adx < 18 && ady < 18) return;

  if (adx > ady) setDir(dx > 0 ? 1 : -1, 0);
  else setDir(0, dy > 0 ? 1 : -1);

  touchStart = { x: t.clientX, y: t.clientY };
}, { passive: true });

canvas.addEventListener("touchend", () => {
  touchStart = null;
  setDir(0, 0);
}, { passive: true });

Besfort Qollaku
IT-Manager
+386 (0) 49 433 580
+43 (0) 660 413 7019
+381 (0) 38 222 212
www.kolegjifama.eu
besfort.collaku@kolegjifama.eu


Besfort Çollaku <besfort.collaku@gmail.com> schrieb am Sa., 20. Dez. 2025, 19:57:
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

document.getElementById("btnHint").addEventListener("click", () => alert("Hint soon 🙂"));
document.getElementById("btnX3").addEventListener("click", () => alert("x3 soon 🙂"));

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

const grid = 9; // little bigger looks nicer
const pad = 26;
const cell = Math.floor((W - pad * 2) / grid);
const boardPx = cell * grid;
const boardX = Math.floor((W - boardPx) / 2);
const boardY = Math.floor((H - boardPx) / 2);

// ---------- LEVEL DATA (walkable path + blocks) ----------
// 0 = hole/pit, 1 = path you can paint
function make2D(n, v) {
  return Array.from({ length: n }, () => Array.from({ length: n }, () => v));
}
function clone2D(a) {
  return a.map(r => r.slice());
}

function applyBlocksToMap(map, blocks) {
  for (const b of blocks) {
    for (let yy = b.y; yy < b.y + b.h; yy++) {
      for (let xx = b.x; xx < b.x + b.w; xx++) {
        if (yy >= 0 && yy < grid && xx >= 0 && xx < grid) map[yy][xx] = 0;
      }
    }
  }
}

function pathLevel242() {
  const path = make2D(grid, 0);

  // Make a "channel" similar to your screenshot: top long + left vertical + right pocket
  // Top row path
  for (let x = 0; x < 9; x++) path[1][x] = 1;

  // Left vertical down
  for (let y = 1; y < 7; y++) path[y][0] = 1;

  // Right pocket-ish channel
  for (let x = 3; x < 9; x++) path[2][x] = 1;
  for (let y = 2; y < 5; y++) path[y][8] = 1;

  // Bottom-ish turn
  for (let x = 0; x < 6; x++) path[6][x] = 1;
  for (let y = 4; y < 7; y++) path[y][5] = 1;

  // Blocks (wood blocks inside the pit) - different sizes
  const blocks = [
    { x: 3, y: 3, w: 1, h: 1 },
    { x: 2, y: 5, w: 1, h: 1 },
    { x: 5, y: 4, w: 2, h: 1 }, // 2x1
    { x: 6, y: 6, w: 3, h: 1 }, // 3x1
  ];

  // Blocks should remain pit area (0), so just keep them 0 (already 0 by default)
  applyBlocksToMap(path, blocks);

  return { path, blocks };
}

let level = pathLevel242();
let map = clone2D(level.path); // 1 = walkable, 0 = pit/blocked
let blocks = level.blocks;

// Painted tiles (only on walkable path)
let painted = make2D(grid, 0);

// ---------- PLAYER (smooth sliding) ----------
let player = {
  gx: 0, gy: 1, // grid pos
  px: 0, py: 0, // pixel pos (center)
  tx: 0, ty: 0, // target pixel pos
  r: Math.floor(cell * 0.18),
  moving: false,
  dirx: 0, diry: 0
};

function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < grid && y < grid;
}
function isWalkable(x, y) {
  return inBounds(x, y) && map[y][x] === 1;
}
function cellCenterX(x) { return boardX + x * cell + cell / 2; }
function cellCenterY(y) { return boardY + y * cell + cell / 2; }

function placePlayerOnFirstPath() {
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      if (map[y][x] === 1) {
        player.gx = x; player.gy = y;
        player.px = cellCenterX(x);
        player.py = cellCenterY(y);
        player.tx = player.px;
        player.ty = player.py;
        painted[y][x] = 1;
        return;
      }
    }
  }
}
placePlayerOnFirstPath();

function paintedCount() {
  let n = 0;
  for (let y = 0; y < grid; y++) for (let x = 0; x < grid; x++) if (painted[y][x] === 1) n++;
  return n;
}
function walkableCount() {
  let n = 0;
  for (let y = 0; y < grid; y++) for (let x = 0; x < grid; x++) if (map[y][x] === 1) n++;
  return n;
}

// ---------- DRAW HELPERS ----------
function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawWoodBoard() {
  // a wood "frame"
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#d8a26a");
  g.addColorStop(1, "#c48b55");
  ctx.fillStyle = g;
  roundedRect(boardX - 16, boardY - 16, boardPx + 32, boardPx + 32, 22);
  ctx.fill();

  // shine
  ctx.fillStyle = "rgba(255,255,255,0.09)";
  roundedRect(boardX - 16, boardY - 16, boardPx + 32, boardPx + 32, 22);
  ctx.fill();
}

function drawPitBackground() {
  // dark pit inside the wood
  const pit = ctx.createLinearGradient(0, boardY, 0, boardY + boardPx);
  pit.addColorStop(0, "#3a241a");
  pit.addColorStop(1, "#1d0f0b");
  ctx.fillStyle = pit;
  roundedRect(boardX, boardY, boardPx, boardPx, 18);
  ctx.fill();

  // vignette
  const v = ctx.createRadialGradient(W/2, H/2, 50, W/2, H/2, 420);
  v.addColorStop(0, "rgba(255,255,255,0.05)");
  v.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = v;
  roundedRect(boardX, boardY, boardPx, boardPx, 18);
  ctx.fill();
}

function drawPathTile(x, y) {
  const px = boardX + x * cell;
  const py = boardY + y * cell;
  const inset = 6;
  const r = Math.floor(cell * 0.23);

  // shadow depth (gives carved channel feel)
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 8;

  const g = ctx.createLinearGradient(px, py, px + cell, py + cell);
  g.addColorStop(0, "#eadfff");
  g.addColorStop(0.4, "#9d7cff");
  g.addColorStop(1, "#5b39ff");

  ctx.fillStyle = g;
  roundedRect(px + inset, py + inset, cell - inset * 2, cell - inset * 2, r);
  ctx.fill();
  ctx.restore();

  // highlight border
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  roundedRect(px + inset + 2, py + inset + 2, cell - inset * 2 - 4, cell - inset * 2 - 4, r - 2);
  ctx.stroke();
}

function drawWoodBlockRect(b) {
  const px = boardX + b.x * cell;
  const py = boardY + b.y * cell;
  const ww = b.w * cell;
  const hh = b.h * cell;

  const inset = 7;
  const r = 16;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.40)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 14;

  const g = ctx.createLinearGradient(px, py, px, py + hh);
  g.addColorStop(0, "#efc08b");
  g.addColorStop(1, "#c78954");

  ctx.fillStyle = g;
  roundedRect(px + inset, py + inset, ww - inset * 2, hh - inset * 2, r);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 2;
  roundedRect(px + inset + 2, py + inset + 2, ww - inset * 2 - 4, hh - inset * 2 - 4, r - 2);
  ctx.stroke();
}

function drawBall(cx, cy, r) {
  // shadow
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + r + 10, r * 1.05, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, 2, cx, cy, r);
  g.addColorStop(0, "#fff6c8");
  g.addColorStop(0.35, "#ffd36a");
  g.addColorStop(1, "#b9781c");

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 10;

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.beginPath();
  ctx.arc(cx - r * 0.35, cy - r * 0.35, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
}

// ---------- MOVEMENT (smooth) ----------
function setDir(dx, dy) {
  player.dirx = dx;
  player.diry = dy;
}

function tryStartMove() {
  if (player.moving) return;

  const nx = player.gx + player.dirx;
  const ny = player.gy + player.diry;

  if (!isWalkable(nx, ny)) return;

  player.gx = nx;
  player.gy = ny;

  player.tx = cellCenterX(nx);
  player.ty = cellCenterY(ny);

  player.moving = true;
}

function update(dt) {
  // If not moving, attempt to start (for held key / swipe)
  if (!player.moving && (player.dirx !== 0 || player.diry !== 0)) {
    tryStartMove();
  }

  if (player.moving) {
    const speed = 520; // px/sec
    const dx = player.tx - player.px;
    const dy = player.ty - player.py;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1) {
      player.px = player.tx;
      player.py = player.ty;
      player.moving = false;

      painted[player.gy][player.gx] = 1;

      // level complete
      if (paintedCount() >= walkableCount()) {
        uiLevelNumber++;
        uiCoins += 15;
        document.getElementById("uiLevel").textContent = `LEVEL ${uiLevelNumber}`;
        document.getElementById("uiCoins").textContent = `${uiCoins}`;

        painted = make2D(grid, 0);
        placePlayerOnFirstPath();
      }
      return;
    }

    const step = Math.min(dist, speed * dt);
    player.px += (dx / dist) * step;
    player.py += (dy / dist) * step;
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  drawWoodBoard();
  drawPitBackground();

  // draw ONLY the carved path tiles (looks like Level UI channels)
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      if (map[y][x] === 1) drawPathTile(x, y);
    }
  }

  // wooden blocks on top
  for (const b of blocks) drawWoodBlockRect(b);

  drawBall(player.px, player.py, player.r);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ---------- INPUT ----------
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") setDir(0, -1);
  if (e.key === "ArrowDown") setDir(0, 1);
  if (e.key === "ArrowLeft") setDir(-1, 0);
  if (e.key === "ArrowRight") setDir(1, 0);

  if (e.key === "r" || e.key === "R") {
    painted = make2D(grid, 0);
    placePlayerOnFirstPath();
  }
});

window.addEventListener("keyup", (e) => {
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) setDir(0, 0);
});

// Swipe (mobile)
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

  const adx = Math.abs(dx), ady = Math.abs(dy);
  if (adx < 18 && ady < 18) return;

  if (adx > ady) setDir(dx > 0 ? 1 : -1, 0);
  else setDir(0, dy > 0 ? 1 : -1);

  touchStart = { x: t.clientX, y: t.clientY };
}, { passive: true });

canvas.addEventListener("touchend", () => {
  touchStart = null;
  setDir(0, 0);
}, { passive: true });

Besfort Qollaku
IT-Manager
+386 (0) 49 433 580
+43 (0) 660 413 7019
+381 (0) 38 222 212
www.kolegjifama.eu
besfort.collaku@kolegjifama.eu


Besfort Çollaku <besfort.collaku@gmail.com> schrieb am Sa., 20. Dez. 2025, 18:11:
import "./style.css";

const app = document.querySelector("#app");

// Fake UI values (you can connect later)
let uiLevelNumber = 242;
let uiCoins = 1888;

app.innerHTML = `
  <div class="ui">
    <div class="topRow">
      <div class="leftStack">
        <button class="iconBtn yellow" id="btnSettings" title="Settings">⚙️</button>
        <div style="position:relative">
          <button class="iconBtn gray" id="btnCalendar" title="Claim">📅</button>
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

// Buttons (for now just demo)
document.getElementById("btnHint").addEventListener("click", () => {
  alert("Hint coming soon 🙂");
});
document.getElementById("btnX3").addEventListener("click", () => {
  alert("x3 reward coming soon 🙂");
});

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

const gridSize = 8;
const pad = 22;
const cell = Math.floor((W - pad * 2) / gridSize);
const boardPx = cell * gridSize;
const boardX = Math.floor((W - boardPx) / 2);
const boardY = Math.floor((H - boardPx) / 2);

// 0 = empty, 1 = wooden block
const LEVELS = [
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
let painted = make2D(gridSize, gridSize, 0);

let player = { x: 0, y: 0, r: Math.floor(cell * 0.18) };
placePlayer();
painted[player.y][player.x] = 1;

let moving = false;
let dir = { x: 0, y: 0 };
let lastMoveAt = 0;

function clone2D(arr){ return arr.map(r => r.slice()); }
function make2D(w,h,val){ return Array.from({length:h},()=>Array.from({length:w},()=>val)); }
function inBounds(x,y){ return x>=0 && y>=0 && x<gridSize && y<gridSize; }
function isBlocked(x,y){ return !inBounds(x,y) || map[y][x] === 1; }

function freeTileCount(){
  let n=0;
  for(let y=0;y<gridSize;y++) for(let x=0;x<gridSize;x++) if(map[y][x]===0) n++;
  return n;
}
function paintedCount(){
  let n=0;
  for(let y=0;y<gridSize;y++) for(let x=0;x<gridSize;x++) if(painted[y][x]===1) n++;
  return n;
}
function placePlayer(){
  for(let y=0;y<gridSize;y++){
    for(let x=0;x<gridSize;x++){
      if(map[y][x]===0){ player.x=x; player.y=y; return; }
    }
  }
}

function roundedRect(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}

function drawHole(){
  const g = ctx.createLinearGradient(0,0,W,H);
  g.addColorStop(0,"#3a241a");
  g.addColorStop(1,"#24140f");
  ctx.fillStyle = g;
  roundedRect(boardX-10, boardY-10, boardPx+20, boardPx+20, 18);
  ctx.fill();

  const v = ctx.createRadialGradient(W/2,H/2,60,W/2,H/2,380);
  v.addColorStop(0,"rgba(255,255,255,0.06)");
  v.addColorStop(1,"rgba(0,0,0,0.40)");
  ctx.fillStyle = v;
  roundedRect(boardX-10, boardY-10, boardPx+20, boardPx+20, 18);
  ctx.fill();
}

function drawPaintTile(x,y){
  const px = boardX + x*cell;
  const py = boardY + y*cell;
  const r = Math.floor(cell*0.22);
  const inset = 5;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 8;

  const g = ctx.createLinearGradient(px,py,px+cell,py+cell);
  g.addColorStop(0,"#d8c8ff");
  g.addColorStop(0.35,"#8b6bff");
  g.addColorStop(1,"#5b39ff");

  ctx.fillStyle = g;
  roundedRect(px+inset, py+inset, cell-inset*2, cell-inset*2, r);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 2;
  roundedRect(px+inset+2, py+inset+2, cell-inset*2-4, cell-inset*2-4, r-2);
  ctx.stroke();
}

function drawBlock(x,y){
  const px = boardX + x*cell;
  const py = boardY + y*cell;
  const r = Math.floor(cell*0.22);
  const inset = 5;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 12;

  const g = ctx.createLinearGradient(px,py,px,py+cell);
  g.addColorStop(0,"#e5b27a");
  g.addColorStop(1,"#c78954");

  ctx.fillStyle = g;
  roundedRect(px+inset, py+inset, cell-inset*2, cell-inset*2, r);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.30)";
  ctx.lineWidth = 2;
  roundedRect(px+inset+2, py+inset+2, cell-inset*2-4, cell-inset*2-4, r-2);
  ctx.stroke();
}

function drawBall(cx,cy,r){
  // shadow
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + r + 10, r*1.0, r*0.40, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  const g = ctx.createRadialGradient(cx - r*0.35, cy - r*0.35, 2, cx, cy, r);
  g.addColorStop(0,"#fff6c8");
  g.addColorStop(0.35,"#ffd36a");
  g.addColorStop(1,"#b9781c");

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 10;

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.beginPath();
  ctx.arc(cx - r*0.35, cy - r*0.35, r*0.28, 0, Math.PI*2);
  ctx.fill();
}

function setDir(dx,dy){
  dir.x = dx; dir.y = dy;
  moving = !(dx===0 && dy===0);
}

function moveStep(){
  if(!moving) return;

  const now = performance.now();
  if(now - lastMoveAt < 85) return;
  lastMoveAt = now;

  const nx = player.x + dir.x;
  const ny = player.y + dir.y;

  if(isBlocked(nx,ny)){
    moving = false;
    return;
  }

  player.x = nx; player.y = ny;
  painted[ny][nx] = 1;

  if(paintedCount() >= freeTileCount()){
    nextLevel();
  }
}

function nextLevel(){
  levelIndex = (levelIndex + 1) % LEVELS.length;
  map = clone2D(LEVELS[levelIndex]);
  painted = make2D(gridSize, gridSize, 0);
  placePlayer();
  painted[player.y][player.x] = 1;
  moving = false;
  dir = {x:0,y:0};

  // update UI level number like “242 → 243 …”
  uiLevelNumber++;
  document.getElementById("uiLevel").textContent = `LEVEL ${uiLevelNumber}`;
  uiCoins += 5;
  document.getElementById("uiCoins").textContent = `${uiCoins}`;
}

function draw(){
  ctx.clearRect(0,0,W,H);
  drawHole();

  for(let y=0;y<gridSize;y++){
    for(let x=0;x<gridSize;x++){
      if(painted[y][x]===1) drawPaintTile(x,y);
    }
  }

  for(let y=0;y<gridSize;y++){
    for(let x=0;x<gridSize;x++){
      if(map[y][x]===1) drawBlock(x,y);
    }
  }

  const cx = boardX + player.x*cell + cell/2;
  const cy = boardY + player.y*cell + cell/2;
  drawBall(cx, cy, player.r);
}

function loop(){
  moveStep();
  draw();
  requestAnimationFrame(loop);
}
loop();

// Keyboard
window.addEventListener("keydown",(e)=>{
  if(e.key==="ArrowUp") setDir(0,-1);
  else if(e.key==="ArrowDown") setDir(0,1);
  else if(e.key==="ArrowLeft") setDir(-1,0);
  else if(e.key==="ArrowRight") setDir(1,0);
  else if(e.key==="r" || e.key==="R"){
    painted = make2D(gridSize, gridSize, 0);
    placePlayer();
    painted[player.y][player.x] = 1;
    moving = false;
    dir = {x:0,y:0};
  }
});
window.addEventListener("keyup",(e)=>{
  if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) setDir(0,0);
});

// Swipe (mobile)
let touchStart = null;
canvas.addEventListener("touchstart",(e)=>{
  const t = e.touches[0];
  touchStart = {x:t.clientX, y:t.clientY};
},{passive:true});

canvas.addEventListener("touchmove",(e)=>{
  if(!touchStart) return;
  const t = e.touches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;

  const adx = Math.abs(dx), ady = Math.abs(dy);
  if(adx < 18 && ady < 18) return;

  if(adx > ady) setDir(dx>0 ? 1 : -1, 0);
  else setDir(0, dy>0 ? 1 : -1);

  touchStart = {x:t.clientX, y:t.clientY};
},{passive:true});

canvas.addEventListener("touchend",()=>{
  touchStart = null;
  setDir(0,0);
},{passive:true});

Besfort Qollaku
IT-Manager
+386 (0) 49 433 580
+43 (0) 660 413 7019
+381 (0) 38 222 212
www.kolegjifama.eu
besfort.collaku@kolegjifama.eu


Besfort Çollaku <besfort.collaku@gmail.com> schrieb am Sa., 20. Dez. 2025, 17:57:

:root{
  --wood1:#d8a26a;
  --wood2:#c48b55;
  --shadow: rgba(0,0,0,.25);
  --panel: rgba(255,255,255,.18);
}

*{box-sizing:border-box}

body{
  margin:0;
  height:100vh;
  display:grid;
  place-items:center;
  font-family:system-ui, Arial, sans-serif;

  background:
    radial-gradient(1200px 700px at 50% 10%, rgba(255,255,255,.25), transparent 60%),
    repeating-linear-gradient(90deg,
      rgba(255,255,255,.06) 0px,
      rgba(255,255,255,.06) 18px,
      rgba(0,0,0,.05) 19px,
      rgba(0,0,0,.05) 36px
    ),
    linear-gradient(120deg, var(--wood1), var(--wood2));
}

#app{
  width:min(560px, 94vw);
  text-align:center;
  user-select:none;
}

.topbar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  margin-bottom:12px;
}

.title{
  font-size:42px;
  font-weight:900;
  letter-spacing:1px;
  margin:0;
  text-shadow: 0 2px 0 rgba(255,255,255,.35);
}

.badge{
  padding:8px 12px;
  border-radius:999px;
  background:rgba(255,255,255,.28);
  box-shadow:0 10px 24px var(--shadow);
  font-weight:700;
}

.panel{
  padding:14px 14px 18px;
  border-radius:18px;
  background: var(--panel);
  backdrop-filter: blur(6px);
  box-shadow: 0 12px 30px var(--shadow);
}

canvas{
  display:block;
  margin:0 auto;
  border-radius:18px;
  box-shadow:
    inset 0 12px 18px rgba(0,0,0,.35),
    inset 0 -8px 12px rgba(255,255,255,.22),
    0 18px 30px rgba(0,0,0,.35);
  touch-action:none;
}
Besfort Qollaku
IT-Manager
+386 (0) 49 433 580
+43 (0) 660 413 7019
+381 (0) 38 222 212
www.kolegjifama.eu
besfort.collaku@kolegjifama.eu


Besfort Çollaku <besfort.collaku@gmail.com> schrieb am Sa., 20. Dez. 2025, 15:24:

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