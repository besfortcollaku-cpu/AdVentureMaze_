// src/game/render.js

export function createRenderer({ canvas, state }) {
  const ctx = canvas.getContext("2d");

  // ─────────────────────────────
  // OPTIONAL TEXTURES
  // ─────────────────────────────
  const trenchTex = new Image();
  trenchTex.src = "/textures/trench_noise.png";

  const liquidTex = new Image();
  liquidTex.src = "/textures/liquid_noise.png";

  let trenchPattern = null;
  let liquidPattern = null;

  function ensurePatterns() {
    if (!trenchPattern && trenchTex.complete && trenchTex.naturalWidth) {
      trenchPattern = ctx.createPattern(trenchTex, "repeat");
    }
    if (!liquidPattern && liquidTex.complete && liquidTex.naturalWidth) {
      liquidPattern = ctx.createPattern(liquidTex, "repeat");
    }
  }

  let w = 0;
  let h = 0;

  let tile = 40;
  let ox = 0;
  let oy = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    w = rect.width;
    h = rect.height;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const base = Math.min(w / state.cols, h / state.rows);
    const zoom = typeof state.level?.zoom === "number" ? state.level.zoom : 1.0;

    let t = Math.floor(base * zoom);
    t = Math.min(t, Math.floor(w / state.cols), Math.floor(h / state.rows));
    tile = Math.max(10, t);

    ox = Math.floor((w - state.cols * tile) / 2);
    oy = Math.floor((h - state.rows * tile) / 2);
  }

  function cellCenter(x, y) {
    return {
      cx: ox + x * tile + tile / 2,
      cy: oy + y * tile + tile / 2,
    };
  }

  function drawBackground() {
    // Keep the canvas transparent always
    ctx.clearRect(0, 0, w, h);
  }

  function getBoardBounds() {
    return {
      x: ox,
      y: oy,
      w: state.cols * tile,
      h: state.rows * tile,
    };
  }

  // Small helpers
  function roundRectPath(x, y, w, h, r) {
    const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function fillRoundRect(x, y, w, h, r) {
    roundRectPath(x, y, w, h, r);
    ctx.fill();
  }

  function strokeRoundRect(x, y, w, h, r) {
    roundRectPath(x, y, w, h, r);
    ctx.stroke();
  }

  // ─────────────────────────────
  // 3D BOARD (SLAB + FRONT FACE)
  // ─────────────────────────────
  function drawBoardSlab() {
    const b = getBoardBounds();

const logicalDepth = 1; // 1 tile thick slab
const depth = tile * logicalDepth;    const bx = b.x - pad;
    const by = b.y - pad;
    const bw = b.w + pad * 2;
    const bh = b.h + pad * 2;

    const slabDepth = Math.round(tile * 0.55);
    const radius = Math.round(tile * 0.25);

    // Drop shadow under the board
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.ellipse(
      bx + bw / 2,
      by + bh + slabDepth * 1.15,
      bw * 0.55,
      slabDepth * 0.65,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Front face (vertical)
    const faceGrad = ctx.createLinearGradient(0, by + bh, 0, by + bh + slabDepth);
    faceGrad.addColorStop(0, "rgba(10,20,35,0.95)");
    faceGrad.addColorStop(1, "rgba(5,10,20,0.95)");
    ctx.fillStyle = faceGrad;
    fillRoundRect(bx, by + bh, bw, slabDepth, radius);

    // Top slab
    const topGrad = ctx.createLinearGradient(0, by, 0, by + bh);
    topGrad.addColorStop(0, "rgba(22,40,70,0.70)");
    topGrad.addColorStop(1, "rgba(8,18,32,0.70)");
    ctx.fillStyle = topGrad;
    fillRoundRect(bx, by, bw, bh, radius);

    // Subtle rim highlight
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 2;
    strokeRoundRect(bx + 1, by + 1, bw - 2, bh - 2, radius);

    // Inner vignette (makes “camera” feel less flat)
    const vignette = ctx.createRadialGradient(
      bx + bw * 0.5,
      by + bh * 0.45,
      bw * 0.15,
      bx + bw * 0.5,
      by + bh * 0.55,
      bw * 0.75
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = vignette;
    fillRoundRect(bx, by, bw, bh, radius);
  }

  // ─────────────────────────────
  // 3D MAZE DRAW
  // - floor (walkable) is recessed tiles
  // - walls are raised blocks (like your screenshot)
  // ─────────────────────────────
  function drawMaze() {
      
      const wall = Math.round(tile * 0.22); // constant wall thickness
    ensurePatterns();

    const time = performance.now() * 0.001;

    // “Height” of raised wall blocks + trench lip depth
    const z = Math.round(Math.max(6, tile * 0.28)); // block height
    const inset = Math.round(Math.max(3, tile * 0.10)); // trench inner inset
    const r = Math.round(tile * 0.18);

    // Colors (crystal theme)
    const floorBase = "#091425"; // deep trench floor
    const grout = "rgba(0,0,0,0.28)";

    // Paint (visited) should be less “glow”, more “crystal fill”
    const paintTop = "#bff3ff";
    const paintMid = "#63d7ff";
    const paintBot = "#1a86b0";

    // ─────────────────────────────
    // PASS 0: Recessed floor tiles (for grid == 0)
    // ─────────────────────────────
    for (let y = 0; y < state.rows; y++) {
      for (let x = 0; x < state.cols; x++) {
        if (state.grid[y][x] !== 0) continue;

        const px = ox + x * tile;
        const py = oy + y * tile;

        // Recess base
        ctx.fillStyle = floorBase;
        ctx.fillRect(px, py, tile, tile);
ctx.fillRect(px + tile - 1, py, 2, tile);
ctx.fillRect(px, py + tile - 1, tile, 2);
        // Optional trench noise (very subtle)
        if (trenchPattern) {
          ctx.save();
          ctx.globalAlpha = 0.18;
          ctx.translate(Math.sin(time + x * 0.2) * 2, Math.cos(time + y * 0.2) * 2);
          ctx.fillStyle = trenchPattern;
          ctx.fillRect(px, py, tile, tile);
          ctx.restore();
        }

        // Inner trench (inset) to feel deeper
        const innerGrad = ctx.createLinearGradient(px, py, px, py + tile);
        innerGrad.addColorStop(0, "rgba(0,0,0,0.35)");
        innerGrad.addColorStop(1, "rgba(255,255,255,0.04)");
        ctx.fillStyle = innerGrad;
        fillRoundRect(px + inset, py + inset, tile - inset * 2, tile - inset * 2, r);

        // Engraved lip: strong top-left shadow, soft bottom-right highlight
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(px + inset, py + inset, tile - inset * 2, Math.max(2, z * 0.20)); // top
        ctx.fillRect(px + inset, py + inset, Math.max(2, z * 0.20), tile - inset * 2); // left

        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fillRect(
          px + inset,
          py + tile - inset - Math.max(2, z * 0.16),
          tile - inset * 2,
          Math.max(2, z * 0.16)
        ); // bottom
        ctx.fillRect(
          px + tile - inset - Math.max(2, z * 0.16),
          py + inset,
          Math.max(2, z * 0.16),
          tile - inset * 2
        ); // right
      }
    }

// ─────────────────────────────
// PASS 1: CONTINUOUS TRENCH SHAPE (NO TILES)
// ─────────────────────────────
ctx.fillStyle = trenchPattern || "#050c18";

ctx.beginPath();

for (let y = 0; y < state.rows; y++) {
  for (let x = 0; x < state.cols; x++) {
    if (state.grid[y][x] === 1) continue;

    const px = ox + x * tile - cameraTilt;
    const py = oy + y * tile - cameraTilt;

    ctx.rect(px, py, tile, tile);
  }
}

ctx.fill();

    // ─────────────────────────────
    // PASS 2: Raised wall blocks (grid == 1) like your screenshot
    // Each wall draws:
    // - side faces (bottom + right)
    // - top face
    // - top highlight
    // ─────────────────────────────
    for (let y = 0; y < state.rows; y++) {
      for (let x = 0; x < state.cols; x++) {
        if (state.grid[y][x] !== 1) continue;

        const px = ox + x * tile;
        const py = oy + y * tile;

        // Side faces (only show where adjacent is floor to avoid double-drawing)
        const isFloorRight = x < state.cols - 1 && state.grid[y][x + 1] === 0;
        const isFloorDown = y < state.rows - 1 && state.grid[y + 1][x] === 0;

        // Right side face
        if (isFloorRight) {
          const g = ctx.createLinearGradient(px + tile, py, px + tile + z, py);
          g.addColorStop(0, "rgba(10,20,35,0.80)");
          g.addColorStop(1, "rgba(5,10,20,0.90)");
          ctx.fillStyle = g;
          ctx.fillRect(px + tile, py + z * 0.10, z, tile - z * 0.10);
        }

        // Bottom side face
        if (isFloorDown) {
          const g = ctx.createLinearGradient(0, py + tile, 0, py + tile + z);
          g.addColorStop(0, "rgba(12,24,42,0.78)");
          g.addColorStop(1, "rgba(5,10,20,0.92)");
          ctx.fillStyle = g;
          // light from top-left
ctx.fillStyle = "rgba(0,0,0,0.55)";
ctx.fillRect(px, py, tile, depth * 0.5); // top wall
ctx.fillRect(px, py, depth * 0.5, tile); // left wall
        }

        // Top face (raised block)
        const topGrad = ctx.createLinearGradient(px, py, px, py + tile);
        topGrad.addColorStop(0, "rgba(25,55,95,0.75)");
        topGrad.addColorStop(1, "rgba(10,20,35,0.78)");

        ctx.fillStyle = topGrad;
        fillRoundRect(px, py, tile, tile, r);

        // Optional stone/crystal noise on block tops (very subtle)
        if (trenchPattern) {
          ctx.save();
          ctx.globalAlpha = 0.08;
          ctx.fillStyle = trenchPattern;
          fillRoundRect(px, py, tile, tile, r);
          ctx.restore();
        }

        // Bevel highlight (top edge)
        ctx.strokeStyle = "rgba(255,255,255,0.10)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px + r, py + 1);
        ctx.lineTo(px + tile - r, py + 1);
        ctx.stroke();

        // Inner shade for volume
        ctx.strokeStyle = "rgba(0,0,0,0.28)";
        ctx.lineWidth = 2;
        strokeRoundRect(px + 1, py + 1, tile - 2, tile - 2, r);
      }
    }
    // ─────────────────────────────
// PASS 5: FRONT FACE (BOARD THICKNESS)
// ─────────────────────────────
const board = getBoardBounds();
const faceDepth = Math.round(tile * 0.35);

// front face shadow
const faceGrad = ctx.createLinearGradient(
  board.x,
  board.y + board.h,
  board.x,
  board.y + board.h + faceDepth
);

faceGrad.addColorStop(0, "rgba(0,0,0,0.55)");
faceGrad.addColorStop(1, "rgba(0,0,0,0.9)");

ctx.fillStyle = faceGrad;
ctx.fillRect(
  board.x,
  board.y + board.h,
  board.w,
  faceDepth
);
  }
  
   // ─────────────────────────────
  // SPOT LIGHT
  // ─────────────────────────────
  
function drawSpotLight() {
  const b = getBoardBounds(); // you already have this helper

  const light = ctx.createRadialGradient(
    b.x - b.w * 0.2,        // light source X (bottom-left, outside board)
    b.y + b.h * 1.2,        // light source Y
    b.w * 0.15,             // inner radius
    b.x + b.w * 0.5,        // spread center X
    b.y + b.h * 0.5,        // spread center Y
    b.w * 0.9               // outer radius
  );

  light.addColorStop(0, "rgba(255,255,255,0.35)");
  light.addColorStop(0.4, "rgba(255,255,255,0.15)");
  light.addColorStop(1, "rgba(0,0,0,0.55)");

  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = light;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.restore();
}
  // ─────────────────────────────
  // GOLD BALL (3D)
  // ─────────────────────────────
  function drawBall(playerFloat) {
    const r = Math.max(10, tile * 0.24);
const cameraTilt = Math.round(tile * 0.22);

const c0 = cellCenter(playerFloat.x, playerFloat.y);
const c = {
  cx: c0.cx - cameraTilt,
  cy: c0.cy - cameraTilt
};    const t = performance.now() * 0.001;

    const dx = playerFloat.vx || 0;
    const dy = playerFloat.vy || 0;
    const len = Math.hypot(dx, dy) || 1;
    const mx = dx / len;
    const my = dy / len;

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.ellipse(c.cx + r * 0.25, c.cy + r * 0.72, r * 1.2, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Gold body
    const lx = c.cx - r * (0.6 + mx * 0.35);
    const ly = c.cy - r * (0.6 + my * 0.35);

    const metal = ctx.createRadialGradient(lx, ly, r * 0.12, c.cx, c.cy, r);
    metal.addColorStop(0.0, "#fffbe6");
    metal.addColorStop(0.18, "#ffe27a");
    metal.addColorStop(0.45, "#e6b200");
    metal.addColorStop(0.72, "#9b6a00");
    metal.addColorStop(1.0, "#2f2000");

    ctx.fillStyle = metal;
    ctx.beginPath();
    ctx.arc(c.cx, c.cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Micro scratches (subtle)
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = "#ffffff";
    for (let i = 0; i < 6; i++) {
      const a = (t * 2 + i) % (Math.PI * 2);
      ctx.beginPath();
      ctx.arc(c.cx, c.cy, r * 0.9, a, a + Math.PI * 0.12);
      ctx.stroke();
    }
    ctx.restore();

    // Inner rim shade
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = r * 0.22;
    ctx.beginPath();
    ctx.arc(c.cx, c.cy, r - ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.stroke();

    // Specular hotspot
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.ellipse(c.cx - r * 0.45, c.cy - r * 0.5, r * 0.22, r * 0.18, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Secondary reflection
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.ellipse(c.cx + r * 0.3, c.cy + r * 0.15, r * 0.5, r * 0.32, 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Subtle aura
    ctx.strokeStyle = "rgba(255,190,80,0.18)";
    ctx.lineWidth = 1.2 + Math.sin(t * 2) * 0.4;
    ctx.beginPath();
    ctx.arc(c.cx, c.cy, r + 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ─────────────────────────────
  // RENDER
  // ─────────────────────────────
  function render(playerFloat) {
  ctx.clearRect(0, 0, w, h);

  drawBackground();
  drawMaze();

  drawSpotLight(); 

  drawBall(playerFloat);
}

  return { resize, render };
}