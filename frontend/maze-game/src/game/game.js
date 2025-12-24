
// src/game/game.js

// STEP 17:

// ✅ Adds setLevel(level) so we can go Next Level without page refresh

// ✅ Calls onLevelComplete({ level, painted, total }) once

export function createGame({ canvas, level, onLevelComplete }) {

const ctx = canvas.getContext("2d");

let controller = null;

let rafId = null;

// ---------- canvas ----------

let w = 0;

let h = 0;

let tile = 40;

let ox = 0;

let oy = 0;

function resizeCanvas() {

const rect = canvas.getBoundingClientRect();

const dpr = Math.min(2, window.devicePixelRatio || 1);



w = rect.width;

h = rect.height;



canvas.width = Math.floor(w * dpr);

canvas.height = Math.floor(h * dpr);

ctx.setTransform(dpr, 0, 0, dpr, 0, 0);



const baseTile = Math.min(w / cols, h / rows);

tile = Math.max(18, Math.floor(baseTile * ZOOM));

}

// ---------- level state ----------

let grid, rows, cols, start, ZOOM;

let player = { x: 1, y: 1 };

let painted = new Set();

let totalPassable = 0;

let moving = false;

let finished = false;

let anim = {

t0: 0,

dur: 200,

sx: 1,

sy: 1,

tx: 1,

ty: 1,

};

function loadLevel(lvl) {

grid = lvl.grid;

rows = grid.length;

cols = grid[0].length;

start = lvl.start || { x: 1, y: 1 };

ZOOM = typeof lvl.zoom === "number" ? lvl.zoom : 1;



player = { x: start.x, y: start.y };

painted = new Set();

painted.add(key(player.x, player.y));



totalPassable = 0;

for (let y = 0; y < rows; y++) {

  for (let x = 0; x < cols; x++) {

    if (isPassable(x, y)) totalPassable++;

  }

}



moving = false;

finished = false;



anim.sx = player.x;

anim.sy = player.y;

anim.tx = player.x;

anim.ty = player.y;



resizeCanvas();

}

function isPassable(x, y) {

if (!grid[y] || typeof grid[y][x] === "undefined") return false;

return grid[y][x] === 0 || grid[y][x] === 2;

}

function key(x, y) {

return x + "," + y;

}

function slideTarget(dx, dy) {

let x = player.x;

let y = player.y;



while (true) {

  const nx = x + dx;

  const ny = y + dy;

  if (!isPassable(nx, ny)) break;

  x = nx;

  y = ny;

}



if (x === player.x && y === player.y) return null;

return { x, y };

}

function paintPath(ax, ay, bx, by) {

const dx = Math.sign(bx - ax);

const dy = Math.sign(by - ay);



let x = ax;

let y = ay;

painted.add(key(x, y));



while (!(x === bx && y === by)) {

  x += dx;

  y += dy;

  painted.add(key(x, y));

}

}

function checkWin(lvlRef) {

if (finished) return;

if (painted.size >= totalPassable) {

  finished = true;

  if (typeof onLevelComplete === "function") {

    onLevelComplete({

      level: lvlRef,

      painted: painted.size,

      total: totalPassable,

    });

  }

}

}

function requestMove(dx, dy) {

if (moving || finished) return;



const target = slideTarget(dx, dy);

if (!target) return;



paintPath(player.x, player.y, target.x, target.y);



moving = true;

anim.t0 = performance.now();

anim.sx = player.x;

anim.sy = player.y;

anim.tx = target.x;

anim.ty = target.y;



const dist = Math.abs(anim.tx - anim.sx) + Math.abs(anim.ty - anim.sy);

anim.dur = 120 + dist * 90;



player.x = target.x;

player.y = target.y;

}

// ---------- input ----------

function bindInputs() {

controller = new AbortController();

const sig = controller.signal;



window.addEventListener(

  "keydown",

  (e) => {

    if (e.key === "ArrowUp") requestMove(0, -1);

    if (e.key === "ArrowDown") requestMove(0, 1);

    if (e.key === "ArrowLeft") requestMove(-1, 0);

    if (e.key === "ArrowRight") requestMove(1, 0);

  },

  { signal: sig }

);



let touchStartX = 0;

let touchStartY = 0;



canvas.addEventListener(

  "touchstart",

  (e) => {

    const t = e.touches[0];

    touchStartX = t.clientX;

    touchStartY = t.clientY;

  },

  { passive: true, signal: sig }

);



canvas.addEventListener(

  "touchend",

  (e) => {

    const t = e.changedTouches[0];

    const dx = t.clientX - touchStartX;

    const dy = t.clientY - touchStartY;



    const ax = Math.abs(dx);

    const ay = Math.abs(dy);

    if (Math.max(ax, ay) < 14) return;



    if (ax > ay) requestMove(dx > 0 ? 1 : -1, 0);

    else requestMove(0, dy > 0 ? 1 : -1);

  },

  { passive: true, signal: sig }

);



window.addEventListener("resize", resizeCanvas, { signal: sig });

}

// ---------- camera ----------

function updateCamera(px, py) {

ox = w / 2 - px;

oy = h / 2 - py;



const mapW = cols * tile;

const mapH = rows * tile;



if (mapW < w) ox = (w - mapW) / 2;

if (mapH < h) oy = (h - mapH) / 2;

}

// ---------- drawing ----------

function eased(t) {

return 1 - Math.pow(1 - t, 3);

}

function getAnimatedPlayer(now) {

if (!moving) {

  const px = (player.x + 0.5) * tile;

  const py = (player.y + 0.5) * tile;

  return { px, py, progress: 0 };

}



const raw = (now - anim.t0) / anim.dur;

const t = Math.max(0, Math.min(1, raw));

const k = eased(t);



const cx = anim.sx + (anim.tx - anim.sx) * k;

const cy = anim.sy + (anim.ty - anim.sy) * k;



return {

  px: (cx + 0.5) * tile,

  py: (cy + 0.5) * tile,

  progress: t,

};

}

function drawBackground() {

ctx.fillStyle = "#0b1220";

ctx.fillRect(0, 0, w, h);

}

function drawGrid() {

for (let y = 0; y < rows; y++) {

  for (let x = 0; x < cols; x++) {

    const px = ox + x * tile;

    const py = oy + y * tile;



    if (grid[y][x] === 1) {

      ctx.fillStyle = "rgba(0,0,0,0.45)";

      ctx.fillRect(px, py, tile, tile);

      ctx.strokeStyle = "rgba(255,255,255,0.06)";

      ctx.strokeRect(px + 0.5, py + 0.5, tile - 1, tile - 1);

      continue;

    }



    if (isPassable(x, y)) {

      ctx.fillStyle = "rgba(255,255,255,0.05)";

      ctx.fillRect(px, py, tile, tile);



      if (painted.has(key(x, y))) {

        ctx.fillStyle = "rgba(37,215,255,0.18)";

        ctx.fillRect(px, py, tile, tile);

      }



      if (grid[y][x] === 2) {

        ctx.fillStyle = "rgba(255,210,120,0.14)";

        ctx.fillRect(px, py, tile, tile);

      }



      ctx.strokeStyle = "rgba(255,255,255,0.05)";

      ctx.strokeRect(px + 0.5, py + 0.5, tile - 1, tile - 1);

    }

  }

}

}

function drawBall(px, py, progress) {

const r = Math.max(10, tile * 0.22);

const bounce = Math.sin(progress * Math.PI) * (tile * 0.10);



ctx.beginPath();

ctx.arc(ox + px + 2, oy + py + 6, r * 1.05, 0, Math.PI * 2);

ctx.fillStyle = "rgba(0,0,0,0.35)";

ctx.fill();



ctx.beginPath();

ctx.arc(ox + px, oy + py - bounce, r, 0, Math.PI * 2);

ctx.fillStyle = "#25d7ff";

ctx.fill();



ctx.beginPath();

ctx.arc(ox + px - r * 0.3, oy + py - bounce - r * 0.35, r * 0.35, 0, Math.PI * 2);

ctx.fillStyle = "rgba(255,255,255,0.55)";

ctx.fill();

}

function drawHUD() {

ctx.fillStyle = "rgba(255,255,255,0.85)";

ctx.font = "14px Arial";

ctx.fillText(`Painted: ${painted.size}/${totalPassable}`, 12, 22);

}

function draw(now) {

drawBackground();



const p = getAnimatedPlayer(now);

updateCamera(p.px, p.py);



drawGrid();

drawBall(p.px, p.py, p.progress);

drawHUD();

}

function loop(now) {

draw(now);



if (moving) {

  const t = (now - anim.t0) / anim.dur;

  if (t >= 1) {

    moving = false;

    checkWin(currentLevelRef);

  }

}



rafId = requestAnimationFrame(loop);

}

// keep current level ref so callback knows which one

let currentLevelRef = level;

// init level

loadLevel(level);

return {

start() {

  if (!controller) bindInputs();

  if (!rafId) rafId = requestAnimationFrame(loop);

  checkWin(currentLevelRef);

},

setLevel(nextLevel) {

  currentLevelRef = nextLevel;

  loadLevel(nextLevel);

  checkWin(currentLevelRef);

},

stop() {

  if (rafId) cancelAnimationFrame(rafId);

  rafId = null;

  if (controller) controller.abort();

  controller = null;

},

};

}
