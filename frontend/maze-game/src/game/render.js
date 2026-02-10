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
  const r = tile * 0.6; // visual size of ball
  const c = cellCenter(playerFloat.x, playerFloat.y);

  // shadow (keep this, gives depth)
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(
    c.cx,
    c.cy + r * 0.45,
    r * 0.55,
    r * 0.25,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  if (ballReady) {
    ctx.drawImage(
      ballImg,
      c.cx - r / 2,
      c.cy - r / 2,
      r,
      r
    );
  } else {
    // fallback circle (in case image not loaded yet)
    ctx.fillStyle = "#ffd54a";
    ctx.beginPath();
    ctx.arc(c.cx, c.cy, r / 2, 0, Math.PI * 2);
    ctx.fill();
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