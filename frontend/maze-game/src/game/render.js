export function createRenderer({ canvas, state }) {
  if (!(canvas instanceof HTMLCanvasElement)) {
    console.error("Renderer: canvas missing");
    return;
  }

  // 🔒 Canvas must NEVER block UI
  canvas.style.pointerEvents = "none";
  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.zIndex = "0";

  const ctx = canvas.getContext("2d");

  // ======================
  // CONFIG
  // ======================
  let w = 0;
  let h = 0;
  let tile = 48;
  let ox = 0;
  let oy = 0;

  // ======================
  // FLOOR TILE
  // ======================
  const floorImg = new Image();
  let floorReady = false;
  floorImg.onload = () => (floorReady = true);
  floorImg.src = "/textures/sprites/crystal/crystal_floor.png";

  // ======================
  // RESIZE (SAFE)
  // ======================
  function resize() {
    if (!state || !state.cols || !state.rows) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    w = rect.width;
    h = rect.height;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // tiles fit board (NO stretch)
    tile = Math.floor(
      Math.min(w / state.cols, h / state.rows)
    );

    ox = Math.floor((w - state.cols * tile) / 2);
    oy = Math.floor((h - state.rows * tile) / 2);
  }

  window.addEventListener("resize", resize);
  resize();

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

  function drawMaze() {
    const grid = state.grid;
    if (!grid) return;

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const depth = y / (state.rows - 1); // 0 top → 1 bottom

const scale = 0.8 + depth * 0.2; // perspective strength
const drawSize = tile * scale;

// keep centered per cell
const px = ox + x * tile + (tile - drawSize) / 2;
const py =
  oy +
  y * tile -
  (1 - depth) * tile * 0.4; // push top rows upward

ctx.drawImage(floorImg, px, py, drawSize, drawSize);
        }
      }
    }
  }

  function drawBall(playerFloat) {
    if (!playerFloat) return;

    const r = tile * 0.28;
    const c = cellCenter(playerFloat.x, playerFloat.y);

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(
      c.cx + 2,
      c.cy + 5,
      r * 1.1,
      r * 0.8,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // ball
    ctx.fillStyle = "#2fe6ff";
    ctx.beginPath();
    ctx.arc(c.cx, c.cy, r, 0, Math.PI * 2);
    ctx.fill();

    // highlight
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.arc(
      c.cx - r * 0.35,
      c.cy - r * 0.35,
      r * 0.35,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  function render(playerFloat) {
    ctx.clearRect(0, 0, w, h);
    drawBackground();
    drawMaze();
    drawBall(playerFloat);
  }

  return { resize, render };
}