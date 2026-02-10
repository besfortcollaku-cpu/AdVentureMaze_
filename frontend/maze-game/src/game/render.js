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
// WALL TILE (visual only)
const wallImg = new Image();
let wallReady = false;
wallImg.onload = () => (wallReady = true);
wallImg.src = "/textures/sprites/crystal/corner_bl.png";
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
    const r = tile * 0.28;
    const c = cellCenter(playerFloat.x, playerFloat.y);

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(c.cx + 2, c.cy + 5, r * 1.1, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // ball
    ctx.fillStyle = "#2fe6ff";
    ctx.beginPath();
    ctx.arc(c.cx, c.cy, r, 0, Math.PI * 2);
    ctx.fill();

    // highlight
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.arc(c.cx - r * 0.35, c.cy - r * 0.35, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  
  
  function drawWalls() {
  const grid = state.grid;

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] !== 1) continue;

      const px = ox + x * tile;
      const py = oy + y * tile;

      // draw wall sprite taller than floor
      // so it looks vertical / 3D
      if (wallReady) {
        ctx.drawImage(
          wallImg,
          px,
          py - tile * 0.5,   // lift wall up
          tile,
          tile * 1.5         // taller than floor
        );
      }
    }
  }
}
  function render(playerFloat) {
  ctx.clearRect(0, 0, w, h);
  drawBackground();
  drawFloor();
    drawBall(playerFloat);
  drawWalls();
}

  return { resize, render };
}