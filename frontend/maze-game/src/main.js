import "./style.css";

/**
 * Adventure Maze (Mobile-first)
 * - Swipe controls + D-pad
 * - 3D wood look
 * - Solid walls (no gaps)
 * - Goal hole + win animation + confetti
 * - Level system (easy to add)
 * - Sound + vibration
 */

/* ------------------------ UI MOUNT ------------------------ */
const app = document.querySelector("#app");
app.innerHTML = `
  <div class="topbar">
    <div class="titleBox">
      <div class="gameTitle">Adventure Maze</div>
      <div class="subTitle" id="subtitle">Swipe to move • Reach the hole</div>
    </div>
    <div class="rightBox">
      <div class="pill" title="Coins (demo)">
        <span class="dot"></span>
        <span id="coins">1888</span>
      </div>
      <button class="iconBtn" id="soundBtn" title="Sound">🔊</button>
    </div>
  </div>

  <div class="stage">
    <canvas id="game"></canvas>

    <div class="hud">
      <button class="bigBtn" id="prevBtn">◀︎ Level</button>
      <button class="bigBtn" id="resetBtn">↻ Reset</button>
      <button class="bigBtn" id="nextBtn">Level ▶︎</button>
    </div>

    <div class="dpadWrap">
      <div class="dpad">
        <div class="empty"></div>
        <button id="upBtn">▲</button>
        <div class="empty"></div>

        <button id="leftBtn">◀</button>
        <button id="centerBtn">●</button>
        <button id="rightBtn">▶</button>

        <div class="empty"></div>
        <button id="downBtn">▼</button>
        <div class="empty"></div>
      </div>
    </div>

    <div class="hintText">Tip: swipe on the board or use the arrows. Works best on phone.</div>
    <div class="toast" id="toast"></div>
  </div>
`;

/* ------------------------ CANVAS SETUP ------------------------ */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });

function resizeCanvas() {
  // phone-first sizing (square)
  const size = Math.min(window.innerWidth * 0.92, 520);
  canvas.width = Math.floor(size);
  canvas.height = Math.floor(size);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* ------------------------ AUDIO / HAPTIC ------------------------ */
let soundOn = true;
const soundBtn = document.getElementById("soundBtn");

soundBtn.addEventListener("click", () => {
  soundOn = !soundOn;
  soundBtn.textContent = soundOn ? "🔊" : "🔇";
  toast(soundOn ? "Sound ON" : "Sound OFF");
});

function vibrate(ms) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch {}
}

let audioCtx = null;
function beep(freq = 440, dur = 0.06, type = "sine", vol = 0.03) {
  if (!soundOn) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + dur);
  } catch {}
}

/* ------------------------ LEVELS ------------------------ */
/**
 * Legend:
 * # = wall
 * . = floor
 * S = start
 * G = goal (hole)
 *
 * Add more levels by pushing to LEVELS array.
 */
const LEVELS = [
  {
    name: "Level 242",
    map: [
      "###############",
      "#S....#.......#",
      "###.#.#.#####.#",
      "#...#...#...#.#",
      "#.#####.#.#.#.#",
      "#.....#.#.#...#",
      "###.#.#.#.###.#",
      "#...#.#...#...#",
      "#.###.#####.#.#",
      "#.....#.....#G#",
      "###############",
    ],
  },
  {
    name: "Level 243",
    map: [
      "###############",
      "#S....#.......#",
      "#.###.#.#####.#",
      "#...#.#.....#.#",
      "###.#.#####.#.#",
      "#...#.....#...#",
      "#.#####.#.###.#",
      "#.....#.#...#.#",
      "#.###.#.###.#.#",
      "#...#.....#..G#",
      "###############",
    ],
  },
];

/* ------------------------ GAME STATE ------------------------ */
let levelIndex = 0;
let grid = [];
let rows = 0;
let cols = 0;

let tile = 32;
let offsetX = 0;
let offsetY = 0;

const player = {
  x: 0, // grid
  y: 0, // grid
  px: 0, // pixel smooth
  py: 0, // pixel smooth
  r: 0, // radius in pixels
  moving: false,
};

let goal = { x: 0, y: 0 };
let won = false;

const subtitle = document.getElementById("subtitle");
const toastEl = document.getElementById("toast");

function toast(msg) {
  toastEl.textContent = msg;
  if (!msg) return;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (toastEl.textContent = ""), 1400);
}

/* ------------------------ PARSE LEVEL ------------------------ */
function loadLevel(i) {
  won = false;
  levelIndex = (i + LEVELS.length) % LEVELS.length;

  const map = LEVELS[levelIndex].map;
  rows = map.length;
  cols = map[0].length;
  grid = map.map((line) => line.split(""));

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] === "S") {
        player.x = x;
        player.y = y;
      }
      if (grid[y][x] === "G") {
        goal.x = x;
        goal.y = y;
      }
    }
  }

  // compute tile size to fill canvas nicely
  const boardSize = Math.min(canvas.width, canvas.height);
  tile = Math.floor(boardSize / Math.max(cols, rows));
  const usedW = tile * cols;
  const usedH = tile * rows;
  offsetX = Math.floor((canvas.width - usedW) / 2);
  offsetY = Math.floor((canvas.height - usedH) / 2);

  player.px = gridToPx(player.x);
  player.py = gridToPy(player.y);
  player.r = tile * 0.34;
  player.moving = false;

  subtitle.textContent = `${LEVELS[levelIndex].name} • Swipe to move • Reach the hole`;
  toast("");
}

function gridToPx(gx) {
  return offsetX + gx * tile + tile / 2;
}
function gridToPy(gy) {
  return offsetY + gy * tile + tile / 2;
}

loadLevel(0);

/* ------------------------ INPUT (KEY + TOUCH) ------------------------ */
const keys = new Set();

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (k.includes("arrow")) e.preventDefault();
  keys.add(k);
});
window.addEventListener("keyup", (e) => {
  keys.delete(e.key.toLowerCase());
});

// D-pad buttons (mobile)
function pressKey(k) {
  keys.add(k);
  setTimeout(() => keys.delete(k), 110);
}
document.getElementById("upBtn").addEventListener("click", () => pressKey("arrowup"));
document.getElementById("downBtn").addEventListener("click", () => pressKey("arrowdown"));
document.getElementById("leftBtn").addEventListener("click", () => pressKey("arrowleft"));
document.getElementById("rightBtn").addEventListener("click", () => pressKey("arrowright"));
document.getElementById("centerBtn").addEventListener("click", () => resetLevel());

// Swipe
let touchStart = null;

canvas.addEventListener(
  "touchstart",
  (e) => {
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY, time: performance.now() };
  },
  { passive: true }
);

canvas.addEventListener(
  "touchmove",
  (e) => {
    if (!touchStart) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;

    // If short swipe, ignore
    const threshold = 18;
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      pressKey(dx > 0 ? "arrowright" : "arrowleft");
    } else {
      pressKey(dy > 0 ? "arrowdown" : "arrowup");
    }

    // reset swipe origin so continuous swipes work
    touchStart = { x: t.clientX, y: t.clientY, time: performance.now() };
  },
  { passive: true }
);

canvas.addEventListener(
  "touchend",
  () => {
    touchStart = null;
  },
  { passive: true }
);

/* ------------------------ UI BUTTONS ------------------------ */
document.getElementById("resetBtn").addEventListener("click", resetLevel);
document.getElementById("nextBtn").addEventListener("click", () => loadLevel(levelIndex + 1));
document.getElementById("prevBtn").addEventListener("click", () => loadLevel(levelIndex - 1));

function resetLevel() {
  beep(260, 0.06, "square", 0.02);
  vibrate(20);
  loadLevel(levelIndex);
}

/* ------------------------ COLLISION / MOVEMENT ------------------------ */
function isWall(x, y) {
  if (x < 0 || y < 0 || x >= cols || y >= rows) return true;
  return grid[y][x] === "#";
}

function tryMove(dx, dy) {
  if (player.moving || won) return;

  const nx = player.x + dx;
  const ny = player.y + dy;
  if (isWall(nx, ny)) {
    beep(120, 0.05, "square", 0.02);
    vibrate(10);
    return;
  }

  player.x = nx;
  player.y = ny;
  player.moving = true;

  beep(540, 0.03, "sine", 0.02);
  vibrate(10);
}

function updateInput() {
  if (keys.has("arrowup")) tryMove(0, -1);
  if (keys.has("arrowdown")) tryMove(0, 1);
  if (keys.has("arrowleft")) tryMove(-1, 0);
  if (keys.has("arrowright")) tryMove(1, 0);
}

/* ------------------------ VISUAL STYLE (LEVEL 242-LIKE) ------------------------ */
function drawWoodBase() {
  // wood-ish background inside canvas area
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#f3d4ab");
  g.addColorStop(1, "#e9b781");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // subtle grain
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 16; i++) {
    const y = (canvas.height / 16) * i + (i % 2) * 6;
    ctx.fillStyle = "rgba(120,70,30,1)";
    ctx.fillRect(0, y, canvas.width, 1);
  }
  ctx.globalAlpha = 1;
}

function drawBoardShadow() {
  // “carved hole” shadow for the maze board
  const x = offsetX - tile * 0.22;
  const y = offsetY - tile * 0.22;
  const w = cols * tile + tile * 0.44;
  const h = rows * tile + tile * 0.44;

  ctx.fillStyle = "rgba(0,0,0,.22)";
  roundRect(ctx, x + 6, y + 8, w, h, 18, true);

  ctx.fillStyle = "rgba(255,255,255,.28)";
  roundRect(ctx, x, y, w, h, 18, true);
}

// NO gaps: each cell is tile x tile exactly.
function drawWall3D(gx, gy) {
  const rx = offsetX + gx * tile;
  const ry = offsetY + gy * tile;

  const depth = Math.max(2, Math.floor(tile * 0.14));

  // drop shadow
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.fillRect(rx + depth, ry + depth, tile, tile);

  // wall face gradient (wood block)
  const grad = ctx.createLinearGradient(rx, ry, rx, ry + tile);
  grad.addColorStop(0, "#e4b07b");
  grad.addColorStop(1, "#b7743f");
  ctx.fillStyle = grad;
  ctx.fillRect(rx, ry, tile, tile);

  // highlight edge
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "#fff";
  ctx.fillRect(rx + 1, ry + 1, tile - 2, Math.max(1, Math.floor(tile * 0.08)));
  ctx.globalAlpha = 1;
}

function drawPathCell(gx, gy) {
  const rx = offsetX + gx * tile;
  const ry = offsetY + gy * tile;

  // “purple tile path” but continuous (no gaps)
  const grad = ctx.createLinearGradient(rx, ry, rx + tile, ry + tile);
  grad.addColorStop(0, "#e9ddff");
  grad.addColorStop(1, "#cbb8ff");

  ctx.fillStyle = grad;
  ctx.fillRect(rx, ry, tile, tile);
}

function drawGoalHole() {
  const cx = gridToPx(goal.x);
  const cy = gridToPy(goal.y);

  const rOuter = tile * 0.42;
  const rInner = tile * 0.22;

  // hole shadow
  ctx.beginPath();
  ctx.arc(cx + tile * 0.06, cy + tile * 0.08, rOuter, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,.30)";
  ctx.fill();

  // rim
  ctx.beginPath();
  ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,.45)";
  ctx.fill();

  // hole
  const g = ctx.createRadialGradient(cx, cy, rInner * 0.3, cx, cy, rOuter);
  g.addColorStop(0, "#2a1b12");
  g.addColorStop(1, "#140c08");
  ctx.beginPath();
  ctx.arc(cx, cy, rOuter * 0.82, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
}

function drawPlayerBall() {
  const cx = player.px;
  const cy = player.py;

  const r = player.r;

  // ball shadow
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.22, cy + r * 0.34, r * 0.9, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,.18)";
  ctx.fill();

  // golden ball with gradient
  const g = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.3, r * 0.2, cx, cy, r);
  g.addColorStop(0, "#fff3b0");
  g.addColorStop(0.35, "#ffd264");
  g.addColorStop(1, "#b97818");

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();

  // highlight
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.arc(cx - r * 0.35, cy - r * 0.35, r * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.globalAlpha = 1;
}

/* ------------------------ CONFETTI WIN ------------------------ */
const confetti = [];
function spawnConfetti() {
  confetti.length = 0;
  for (let i = 0; i < 120; i++) {
    confetti.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.8) * 6,
      r: 2 + Math.random() * 3,
      a: Math.random() * Math.PI * 2,
      va: (Math.random() - 0.5) * 0.3,
      life: 80 + Math.random() * 50,
    });
  }
}

function updateConfetti() {
  for (const c of confetti) {
    c.x += c.vx;
    c.y += c.vy;
    c.vy += 0.12; // gravity
    c.a += c.va;
    c.life -= 1;
  }
  for (let i = confetti.length - 1; i >= 0; i--) {
    if (confetti[i].life <= 0) confetti.splice(i, 1);
  }
}

function drawConfetti() {
  if (!confetti.length) return;
  ctx.save();
  for (const c of confetti) {
    ctx.translate(c.x, c.y);
    ctx.rotate(c.a);
    ctx.fillStyle = pickConfettiColor(c.life);
    ctx.fillRect(-c.r, -c.r, c.r * 2, c.r * 2);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  ctx.restore();
}
function pickConfettiColor(seed) {
  const colors = ["#ff4d4d", "#ffd54a", "#46d6ff", "#7cff76", "#c87bff"];
  return colors[Math.floor(seed) % colors.length];
}

/* ------------------------ UPDATE + DRAW LOOP ------------------------ */
function update() {
  updateInput();

  // smooth movement toward target grid center
  const tx = gridToPx(player.x);
  const ty = gridToPy(player.y);

  const speed = Math.max(2, Math.floor(tile * 0.22));
  const dx = tx - player.px;
  const dy = ty - player.py;

  if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
    player.px = tx;
    player.py = ty;
    player.moving = false;
  } else {
    player.px += Math.sign(dx) * Math.min(Math.abs(dx), speed);
    player.py += Math.sign(dy) * Math.min(Math.abs(dy), speed);
  }

  // win check (must be centered)
  if (!won && !player.moving && player.x === goal.x && player.y === goal.y) {
    won = true;
    toast("✅ Level Complete!");
    vibrate(80);

    beep(880, 0.07, "sine", 0.03);
    setTimeout(() => beep(990, 0.07, "sine", 0.03), 90);
    setTimeout(() => beep(1180, 0.09, "sine", 0.03), 180);

    spawnConfetti();

    // auto next after a moment
    setTimeout(() => loadLevel(levelIndex + 1), 900);
  }

  updateConfetti();
}

function draw() {
  drawWoodBase();
  drawBoardShadow();

  // draw floor/path first
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = grid[y][x];
      if (cell !== "#") drawPathCell(x, y);
    }
  }

  // goal hole on top of path
  drawGoalHole();

  // walls on top (no gaps)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] === "#") drawWall3D(x, y);
    }
  }

  drawPlayerBall();
  drawConfetti();

  // win overlay
  if (won) {
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();

/* ------------------------ HELPERS ------------------------ */
function roundRect(ctx, x, y, w, h, r, fill) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
  if (fill) ctx.fill();
}