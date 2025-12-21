import "./style.css";
import { piLoginAndVerify } from "./piAuth.js";

/**
 * ✅ SET THIS to your Render backend base URL (must be HTTPS)
 * Example: https://adventuremaze-backend.onrender.com
 * NOTE: no trailing slash needed (safe either way)
 */
const BACKEND = "https://adventuremaze.onrender.com";

// =====================
// Build UI FIRST
// =====================
const app = document.querySelector("#app");

app.innerHTML =
  '<div class="phone">' +
  '<div class="topbar">' +
  '<div class="topRow">' +
  '<div class="brand">' +
  '<div class="logoBox" title="Adventure Maze">' +
  '<img src="/logo.png" alt="Adventure Maze Logo" />' +
  "</div>" +
  "</div>" +
  '<div class="levelWrap">' +
  '<div class="levelNew">NEW!</div>' +
  '<div class="levelText">LEVEL 242</div>' +
  "</div>" +
  '<div class="coins" title="Coins">' +
  '<div class="coinDot"></div>' +
  '<div id="coinCount">1888</div>' +
  "</div>" +
  "</div>" +
  '<div class="iconRow">' +
  iconBtn("settings", gearSVG(), "") +
  iconBtn("controls", joystickSVG(), "") +
  iconBtn("paint", brushSVG(), "NEW") +
  iconBtn("trophy", trophySVG(), "") +
  iconBtn("noads", noAdsSVG(), "") +
  '<div class="loginWrap">' +
  '<button class="iconBtnWide" id="loginBtn"><span id="loginBtnText">Login with Pi</span></button>' +
  '<div class="userPill" id="userPill">User: guest</div>' +
  "</div>" +
  "</div>" +
  "</div>" +
  '<div class="boardWrap">' +
  '<div class="boardFrame">' +
  '<canvas id="game"></canvas>' +
  "</div>" +
  "</div>" +
  '<div class="bottomBar">' +
  '<button class="btn" id="hintBtn"><div class="btnIcon">🎬</div><div>HINT</div></button>' +
  '<div class="pill">Swipe to move</div>' +
  '<button class="btn" id="x3Btn"><div class="btnIcon">⏩</div><div>×3</div></button>' +
  "</div>" +
  "</div>" +
  '<div class="desktopBlock" id="desktopBlock">' +
  '<div class="desktopCard">' +
  "<h2>Mobile game</h2>" +
  "<p>This game is designed for smartphones. Use swipe on mobile. Desktop is only for testing (arrow keys).</p>" +
  "</div>" +
  "</div>";

// Inject CSS for login UI (and small fixes)
const extra = document.createElement("style");
extra.textContent = `
  .loginWrap{ display:flex; gap:10px; align-items:center; margin-left:auto; }
  .iconBtnWide{
    height:42px;
    padding:0 14px;
    border-radius:14px;
    border:1px solid rgba(255,255,255,.18);
    background: rgba(18,28,60,.55);
    color:#fff;
    font-weight:800;
    letter-spacing:.2px;
    cursor:pointer;
    white-space:nowrap;
  }
  .iconBtnWide:active{ transform: translateY(1px); }
  .iconBtnWide:disabled{ opacity:.6; cursor:not-allowed; transform:none; }
  .userPill{
    height:42px;
    display:flex;
    align-items:center;
    padding:0 12px;
    border-radius:14px;
    border:1px solid rgba(255,255,255,.12);
    background: rgba(0,0,0,.22);
    color: rgba(234,243,255,.9);
    font-weight:700;
    font-size:13px;
    white-space:nowrap;
  }
  @media (max-width: 420px){
    .loginWrap{ width:100%; justify-content:space-between; margin-left:0; }
    .iconBtnWide{ flex:1; }
    .userPill{ flex:1; justify-content:center; }
  }
`;
document.head.appendChild(extra);

function iconBtn(id, svg, badgeText) {
  return (
    '<button class="iconBtn" id="' +
    id +
    '">' +
    (badgeText ? '<div class="badgeNew">' + badgeText + "</div>" : "") +
    svg +
    "</button>"
  );
}

/* ---------- SVG icons ---------- */
function gearSVG() {
  return (
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" stroke="rgba(234,243,255,.95)" stroke-width="1.8"/>' +
    '<path d="M19 13.2v-2.4l-2.1-.5a7.5 7.5 0 0 0-.6-1.4l1.2-1.8-1.7-1.7-1.8 1.2c-.5-.25-1-.45-1.5-.6L12.8 3h-2.4l-.5 2.1c-.5.15-1 .35-1.4.6L6.7 4.5 5 6.2l1.2 1.8c-.25.45-.45.95-.6 1.45L3.5 10.8v2.4l2.1.5c.15.5.35 1 .6 1.4L5 16.9l1.7 1.7 1.8-1.2c.45.25.95.45 1.45.6l.5 2.1h2.4l.5-2.1c.5-.15 1-.35 1.4-.6l1.8 1.2 1.7-1.7-1.2-1.8c.25-.45.45-.95.6-1.45L19 13.2Z" stroke="rgba(234,243,255,.75)" stroke-width="1.6" stroke-linejoin="round"/>' +
    "</svg>"
  );
}
function joystickSVG() {
  return (
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M9 8.5c0-1.7 1.3-3 3-3s3 1.3 3 3v1.2c0 1.7-1.3 3-3 3s-3-1.3-3-3V8.5Z" stroke="rgba(234,243,255,.9)" stroke-width="1.8"/>' +
    '<path d="M6.5 19.5h11c1.2 0 2.2-1 2.2-2.2 0-3-2.4-5.4-5.4-5.4H9.7c-3 0-5.4 2.4-5.4 5.4 0 1.2 1 2.2 2.2 2.2Z" stroke="rgba(234,243,255,.75)" stroke-width="1.8" stroke-linejoin="round"/>' +
    '<path d="M7.3 15.3h2.4M16.3 15.3h-2.4" stroke="rgba(37,215,255,.95)" stroke-width="2.1" stroke-linecap="round"/>' +
    "</svg>"
  );
}
function brushSVG() {
  return (
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M14.5 3.5 20.5 9.5 11 19c-.7.7-1.7 1-2.7.8l-2.8-.6.6-2.8c.2-1 .5-2 1.2-2.7L14.5 3.5Z" stroke="rgba(234,243,255,.85)" stroke-width="1.8" stroke-linejoin="round"/>' +
    '<path d="M7.2 20.1c.1.8-.1 1.6-.7 2.2-.9.9-2.4.9-3.3 0" stroke="rgba(37,215,255,.95)" stroke-width="2.1" stroke-linecap="round"/>' +
    "</svg>"
  );
}
function trophySVG() {
  return (
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M8 5h8v3.2c0 2.8-1.8 5.2-4 5.2s-4-2.4-4-5.2V5Z" stroke="rgba(234,243,255,.85)" stroke-width="1.8" stroke-linejoin="round"/>' +
    '<path d="M9 19h6M10.2 16.5h3.6" stroke="rgba(234,243,255,.75)" stroke-width="1.8" stroke-linecap="round"/>' +
    '<path d="M6.5 6.2H4.5c0 3 1.4 4.8 3.6 5.4M17.5 6.2h2c0 3-1.4 4.8-3.6 5.4" stroke="rgba(37,215,255,.95)" stroke-width="1.8" stroke-linecap="round"/>' +
    "</svg>"
  );
}
function noAdsSVG() {
  return (
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M7 7h10l-1 11H8L7 7Z" stroke="rgba(234,243,255,.85)" stroke-width="1.8" stroke-linejoin="round"/>' +
    '<path d="M9 7V5.5c0-.8.7-1.5 1.5-1.5h3c.8 0 1.5.7 1.5 1.5V7" stroke="rgba(234,243,255,.75)" stroke-width="1.8" stroke-linejoin="round"/>' +
    '<path d="M5 19 19 5" stroke="rgba(255,75,58,.95)" stroke-width="2.4" stroke-linecap="round"/>' +
    "</svg>"
  );
}

// =====================
// Device helpers
// =====================
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

// =====================
// Pi Login (non-blocking)
// =====================
let CURRENT_USER = { username: "guest", uid: null };
let CURRENT_ACCESS_TOKEN = null;

const loginBtn = document.getElementById("loginBtn");
const loginBtnText = document.getElementById("loginBtnText");
const userPill = document.getElementById("userPill");

async function doPiLogin() {
  try {
    loginBtn.disabled = true;
    loginBtnText.textContent = "Logging in...";

    const { auth, verifiedUser } = await piLoginAndVerify(BACKEND);

    CURRENT_ACCESS_TOKEN = auth.accessToken;

    const username = verifiedUser?.username || auth?.user?.username || "unknown";
    const uid = verifiedUser?.uid || auth?.user?.uid || null;

    CURRENT_USER = { username, uid };
    userPill.textContent = `User: ${CURRENT_USER.username}`;
    loginBtnText.textContent = "Logged in ✅";
  } catch (e) {
    alert("Pi Login failed: " + (e?.message || String(e)));
    loginBtnText.textContent = "Login with Pi";
  } finally {
    loginBtn.disabled = false;
  }
}
loginBtn.addEventListener("click", doPiLogin);

// =====================
// Canvas setup
// =====================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let tile = 40;
let boardW = 0;
let boardH = 0;
let ox = 0;
let oy = 0;

// =====================
// Level
// =====================
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

// =====================
// Paint trail
// =====================
const painted = new Set();
const paintPops = [];
paintCell(start.x, start.y);
function key(x, y) { return x + "," + y; }
function paintCell(x, y) {
  const k = key(x, y);
  if (!painted.has(k)) painted.add(k);
  paintPops.push({ x, y, t0: performance.now() });
  if (paintPops.length > 70) paintPops.shift();
}

// =====================
// Dust
// =====================
const dust = [];
let lastDustTime = 0;

function addDustBurst(px, py, vx, vy, speed) {
  const now = performance.now();
  if (now - lastDustTime < 18) return;
  lastDustTime = now;

  const count = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) {
    const life = 420 + Math.random() * 380;
    const rr = tile * (0.035 + Math.random() * 0.03);

    const back = 10 + Math.random() * 10;
    const sx = px - vx * back + (Math.random() - 0.5) * 10;
    const sy = py - vy * back + (Math.random() - 0.5) * 10;

    const side = (Math.random() - 0.5) * 0.45;
    const dvx = (vx * -0.15 + side * vy) * (0.35 + Math.random() * 0.6) * speed;
    const dvy = (vy * -0.15 - side * vx) * (0.35 + Math.random() * 0.6) * speed;

    dust.push({
      x: sx, y: sy,
      vx: dvx, vy: dvy,
      r: rr,
      t0: now,
      life,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.18,
      alpha0: 0.22 + Math.random() * 0.18
    });
  }
  if (dust.length > 260) dust.splice(0, dust.length - 260);
}

function drawDust(now) {
  if (dust.length === 0) return;

  for (let i = dust.length - 1; i >= 0; i--) {
    const p = dust[i];
    const age = now - p.t0;
    const t = age / p.life;
    if (t >= 1) { dust.splice(i, 1); continue; }

    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.985; p.vy *= 0.985;
    p.rot += p.spin;

    const fade = 1 - t;
    const a = p.alpha0 * fade;

    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.translate(-p.x, -p.y);

    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.6);
    grad.addColorStop(0, "rgba(255,245,230,0.85)");
    grad.addColorStop(0.55, "rgba(214,168,120,0.55)");
    grad.addColorStop(1, "rgba(214,168,120,0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.r * 2.2, p.r * 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// =====================
// Smooth movement
// =====================
let moving = false;
let moveQueue = [];
let anim = { t0: 0, dur: 140, sx: start.x, sy: start.y, tx: start.x, ty: start.y };

function requestMove(dx, dy) {
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
  anim.sx = playerCell.x; anim.sy = playerCell.y;
  anim.tx = nx; anim.ty = ny;

  playerCell.x = nx; playerCell.y = ny;
  paintCell(nx, ny);

  const ddx = anim.tx - anim.sx;
  const ddy = anim.ty - anim.sy;
  const len = Math.max(0.001, Math.sqrt(ddx*ddx + ddy*ddy));
  roll.axisX = ddx / len;
  roll.axisY = ddy / len;
}

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
let touchStartX = 0, touchStartY = 0;
canvas.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
}, { passive: true });

canvas.addEventListener("touchend", (e) => {
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;
  const ax = Math.abs(dx), ay = Math.abs(dy);
  if (Math.max(ax, ay) < 14) return;
  if (ax > ay) requestMove(dx > 0 ? 1 : -1, 0);
  else requestMove(0, dy > 0 ? 1 : -1);
}, { passive: true });

/* UI click handlers */
document.getElementById("hintBtn").addEventListener("click", () => alert("Hint later 😉"));
document.getElementById("x3Btn").addEventListener("click", () => alert("Boost later 😉"));
document.getElementById("settings").addEventListener("click", () => alert("Settings later"));
document.getElementById("controls").addEventListener("click", () => alert("Controls: Swipe / Arrows"));
document.getElementById("paint").addEventListener("click", () => alert("Paint shop later 😄"));
document.getElementById("trophy").addEventListener("click", () => alert("Trophies later"));
document.getElementById("noads").addEventListener("click", () => alert("Remove Ads later"));

// =====================
// Resize
// =====================
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

// =====================
// Drawing helpers
// =====================
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
  return { cx: ox + x * tile + tile / 2, cy: oy + y * tile + tile / 2 };
}

// Rolling state
const roll = { axisX: 1, axisY: 0, rot: 0, lastNow: 0 };

// Wood background
function drawWoodBackground() {
  const g = ctx.createLinearGradient(0, 0, 0, boardH);
  g.addColorStop(0, "#f0b77d");
  g.addColorStop(1, "#d89255");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, boardW, boardH);

  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 10; i++) {
    const y = (boardH / 10) * i;
    ctx.fillStyle = i % 2 === 0 ? "#8a4f22" : "#6f3d18";
    ctx.fillRect(0, y, boardW, 2);
  }
  ctx.globalAlpha = 1;

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

// Pit
function drawPit() {
  const pitPad = tile * 0.12;

  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = "#2a1b12";
  ctx.fillRect(ox, oy, cols * tile, rows * tile);
  ctx.restore();

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] !== 1) continue;

      const px = ox + x * tile + pitPad;
      const py = oy + y * tile + pitPad;
      const pw = tile - pitPad * 2;
      const ph = tile - pitPad * 2;
      const r = Math.max(10, Math.floor(tile * 0.22));

      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = "#1b100b";
      roundRect(px, py, pw, ph, r);
      ctx.fill();
      ctx.restore();

      const gg = ctx.createRadialGradient(px + pw*0.35, py + ph*0.25, 4, px + pw/2, py + ph/2, pw);
      gg.addColorStop(0, "#2b1a12");
      gg.addColorStop(1, "#120a07");
      ctx.fillStyle = gg;
      roundRect(px, py, pw, ph, r);
      ctx.fill();

      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = "#6a3b1f";
      ctx.lineWidth = 2;
      roundRect(px + 1, py + 1, pw - 2, ph - 2, r);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}

// Wooden blocks
const woodBlocks = [
  { x: 4, y: 4, w: 1, h: 1 },
  { x: 6, y: 6, w: 2, h: 1 },
  { x: 3, y: 7, w: 1, h: 1 },
];

function drawWoodBlock(rect) {
  const pad = tile * 0.12;
  const x = ox + rect.x * tile + pad;
  const y = oy + rect.y * tile + pad;
  const w = rect.w * tile - pad * 2;
  const h = rect.h * tile - pad * 2;
  const r = Math.max(12, Math.floor(tile * 0.25));

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.40)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = "#000";
  roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.restore();

  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, "#f3bf7f");
  g.addColorStop(1, "#d08a4c");

  roundRect(x, y, w, h, r);
  ctx.fillStyle = g;
  ctx.fill();

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

  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "#fff2d8";
  ctx.lineWidth = 3;
  roundRect(x + 2, y + 2, w - 4, h - 4, r);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// Start/Goal small helpers
function drawStartRing(cx, cy, r) {
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = "#25d7ff";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2.0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
function drawGoalSocket(cx, cy, r) {
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = "#ffd95a";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2.0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// Track (connected, no gaps)
function drawTrackBase() {
  const thick = tile * 0.78;
  const half = thick / 2;
  const rad = Math.max(12, Math.floor(thick * 0.28));
  const overlap = 1.4;

  const trackGrad = ctx.createLinearGradient(0, oy, 0, oy + rows * tile);
  trackGrad.addColorStop(0, "#e9d6ff");
  trackGrad.addColorStop(1, "#cbb2ff");

  function glowStroke(pathFn) {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = 10;
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    pathFn(); ctx.stroke();

    ctx.globalAlpha = 0.10;
    ctx.lineWidth = 14;
    ctx.strokeStyle = "rgba(37,215,255,0.50)";
    pathFn(); ctx.stroke();
    ctx.restore();
  }
  function fillTrack(pathFn) {
    ctx.save();
    ctx.fillStyle = trackGrad;
    pathFn(); ctx.fill();

    ctx.globalAlpha = 0.14;
    ctx.fillStyle = "#ffffff";
    pathFn(); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!isTrack(x, y)) continue;

      const { cx, cy } = cellCenter(x, y);

      const nodePath = () => roundRect(cx - half, cy - half, thick, thick, rad);
      glowStroke(nodePath);
      fillTrack(nodePath);

      const up = isTrack(x, y - 1);
      const down = isTrack(x, y + 1);
      const left = isTrack(x - 1, y);
      const right = isTrack(x + 1, y);

      if (up) { const p = () => roundRect(cx - half, cy - tile / 2 - overlap, thick, tile / 2 + overlap, rad); glowStroke(p); fillTrack(p); }
      if (down){ const p = () => roundRect(cx - half, cy, thick, tile / 2 + overlap, rad); glowStroke(p); fillTrack(p); }
      if (left){ const p = () => roundRect(cx - tile / 2 - overlap, cy - half, tile / 2 + overlap, thick, rad); glowStroke(p); fillTrack(p); }
      if (right){const p = () => roundRect(cx, cy - half, tile / 2 + overlap, thick, rad); glowStroke(p); fillTrack(p); }
    }
  }

  const s = cellCenter(start.x, start.y);
  drawStartRing(s.cx, s.cy, tile * 0.22);

  const g = cellCenter(goal.x, goal.y);
  drawGoalSocket(g.cx, g.cy, tile * 0.22);
}

// Paint trail draw
function drawPaintTrail(now) {
  // paint on each painted cell with soft glow
  ctx.save();
  for (const k of painted) {
    const [x, y] = k.split(",").map(Number);
    const { cx, cy } = cellCenter(x, y);
    const r = tile * 0.24;

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.2);
    grad.addColorStop(0, "rgba(37,215,255,0.25)");
    grad.addColorStop(0.55, "rgba(37,215,255,0.10)");
    grad.addColorStop(1, "rgba(37,215,255,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // pop effect
  for (let i = paintPops.length - 1; i >= 0; i--) {
    const p = paintPops[i];
    const t = (now - p.t0) / 220;
    if (t >= 1) continue;
    const { cx, cy } = cellCenter(p.x, p.y);
    const rr = tile * (0.20 + 0.22 * t);
    ctx.globalAlpha = 0.22 * (1 - t);
    ctx.strokeStyle = "rgba(37,215,255,0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// Metallic shine
function drawMetallicShine(px, py, r, angle, sparklePhase) {
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(angle);
  ctx.translate(-px, -py);

  const hx = px - r * 0.22;
  const hy = py - r * 0.62;
  const main = ctx.createRadialGradient(hx, hy, r * 0.08, hx, hy, r * 1.45);
  main.addColorStop(0, "rgba(255,255,255,0.98)");
  main.addColorStop(0.22, "rgba(255,255,255,0.45)");
  main.addColorStop(0.60, "rgba(255,255,255,0.12)");
  main.addColorStop(1, "rgba(255,255,255,0)");
  ctx.globalAlpha = 0.70;
  ctx.fillStyle = main;
  ctx.beginPath();
  ctx.ellipse(hx, hy, r * 0.74, r * 0.52, 0, 0, Math.PI * 2);
  ctx.fill();

  const sx = px + r * 0.22;
  const sy = py - r * 0.30;
  const sparkA = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(sparklePhase));
  const spark = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 0.65);
  spark.addColorStop(0, "rgba(255,255,255,0.95)");
  spark.addColorStop(0.20, "rgba(255,255,255,0.35)");
  spark.addColorStop(1, "rgba(255,255,255,0)");
  ctx.globalAlpha = sparkA;
  ctx.fillStyle = spark;
  ctx.beginPath();
  ctx.ellipse(sx, sy, r * 0.35, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  const stripeW = r * 2.2;
  const stripeH = r * 0.40;
  const slide = Math.sin(sparklePhase) * r * 0.22;
  const stripe = ctx.createLinearGradient(px - stripeW/2 + slide, py, px + stripeW/2 + slide, py);
  stripe.addColorStop(0, "rgba(255,255,255,0)");
  stripe.addColorStop(0.25, "rgba(255,255,255,0.18)");
  stripe.addColorStop(0.50, "rgba(255,255,255,0.45)");
  stripe.addColorStop(0.75, "rgba(255,255,255,0.16)");
  stripe.addColorStop(1, "rgba(255,255,255,0)");
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = stripe;

  ctx.save();
  ctx.beginPath();
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.beginPath();
  ctx.ellipse(px, py + r * 0.18, stripeW * 0.5, stripeH, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = Math.max(2, r * 0.10);
  ctx.beginPath();
  ctx.arc(px, py, r * 0.98, -Math.PI * 0.05, Math.PI * 0.55);
  ctx.stroke();

  ctx.restore();
  ctx.globalAlpha = 1;
}

// Player draw
function drawPlayer(px, py, bounce, shineAngle, sparklePhase) {
  const r = tile * 0.22;

  ctx.save();
  ctx.translate(px, py - bounce.lift);
  ctx.scale(bounce.sx, bounce.sy);
  ctx.translate(-px, -py);

  ctx.beginPath();
  ctx.arc(px + 2, py + 4, r * 1.08, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fill();

  const g = ctx.createRadialGradient(px - r*0.35, py - r*0.35, r*0.2, px, py, r);
  g.addColorStop(0, "#fff9d2");
  g.addColorStop(0.38, "#ffd95a");
  g.addColorStop(0.68, "#ffb500");
  g.addColorStop(1, "#b87300");

  ctx.beginPath();
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();

  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.arc(px + r*0.08, py + r*0.18, r*0.78, 0, Math.PI * 2);
  ctx.fillStyle = "#6b3f00";
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.globalAlpha = 0.16;
  ctx.beginPath();
  ctx.arc(px, py, r * 1.18, 0, Math.PI * 2);
  ctx.strokeStyle = "#25d7ff";
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.globalAlpha = 1;

  drawMetallicShine(px, py, r, shineAngle, sparklePhase);
  ctx.restore();
}

function updateRoll(now, progress) {
  if (!roll.lastNow) roll.lastNow = now;
  const dt = Math.min(40, now - roll.lastNow);
  roll.lastNow = now;

  const speed = moving ? (0.22 + 0.52 * Math.sin(progress * Math.PI)) : 0.03;
  roll.rot += speed * dt;

  const dirAngle = Math.atan2(roll.axisY, roll.axisX);
  const shineAngle = dirAngle + roll.rot * 0.02 + progress * 1.35;
  const sparklePhase = roll.rot * 0.012 + progress * 2.2;

  return { shineAngle, sparklePhase };
}

function getAnimatedPlayer(now) {
  if (!moving) {
    const c = cellCenter(playerCell.x, playerCell.y);
    return { px: c.cx, py: c.cy, done: true, progress: 0 };
  }
  const t = (now - anim.t0) / anim.dur;
  const clamped = Math.max(0, Math.min(1, t));
  const k = 1 - Math.pow(1 - clamped, 3);

  const sx = anim.sx + (anim.tx - anim.sx) * k;
  const sy = anim.sy + (anim.ty - anim.sy) * k;
  const c = cellCenter(sx, sy);
  return { px: c.cx, py: c.cy, done: t >= 1, progress: clamped };
}

function bounceParams(progress) {
  const s = Math.sin(progress * Math.PI);
  return { sx: 1 + 0.10 * s, sy: 1 - 0.14 * s, lift: 6 * s };
}

// =====================
// Main render
// =====================
function draw(now) {
  ctx.clearRect(0, 0, boardW, boardH);

  drawWoodBackground();
  drawPit();
  for (let i = 0; i < woodBlocks.length; i++) drawWoodBlock(woodBlocks[i]);

  drawTrackBase();
  drawPaintTrail(now);
  drawDust(now);

  const p = getAnimatedPlayer(now);
  const b = moving ? bounceParams(p.progress) : { sx: 1, sy: 1, lift: 0 };

  const rm = updateRoll(now, p.progress);
  drawPlayer(p.px, p.py, b, rm.shineAngle, rm.sparklePhase);

  if (moving) {
    const ddx = anim.tx - anim.sx;
    const ddy = anim.ty - anim.sy;
    const len = Math.max(0.001, Math.sqrt(ddx*ddx + ddy*ddy));
    addDustBurst(p.px, p.py, ddx / len, ddy / len, 1.0);
  }

  if (moving && p.done) onMoveFinished();
}

// =====================
// Game loop
// =====================
function loop(now) {
  draw(now);
  requestAnimationFrame(loop);
}

// init
resizeCanvas();
requestAnimationFrame(loop);