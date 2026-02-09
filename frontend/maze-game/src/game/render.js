// src/game/render.js

export function createRenderer({ canvas, state }) {
  const ctx = canvas.getContext("2d");

  // ─────────────────────────────
  // TEXTURES (OPTIONAL)
  // ─────────────────────────────
  const trenchTex = new Image();
  trenchTex.src = "/textures/trench_noise.png";

  const liquidTex = new Image();
  liquidTex.src = "/textures/liquid_noise.png";

  let trenchPattern = null;
  let liquidPattern = null;

  function ensurePatterns() {
    if (!trenchPattern && trenchTex.complete && trenchTex.naturalWidth > 0) {
      trenchPattern = ctx.createPattern(trenchTex, "repeat");
    }
    if (!liquidPattern && liquidTex.complete && liquidTex.naturalWidth > 0) {
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
    // keep fully transparent so app background shows through
    ctx.clearRect(0, 0, w, h);
  }

  // ─────────────────────────────
  // HELPERS
  // ─────────────────────────────
  function rr(x, y, w, h, r) {
    const radius = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function getBoardBounds() {
    return {
      x: ox,
      y: oy,
      w: state.cols * tile,
      h: state.rows * tile,
    };
  }

  function drawBoardBase() {
    const b = getBoardBounds();

    // soft shadow under board (makes it feel like a slab)
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(
      b.x + b.w / 2,
      b.y + b.h + tile * 0.35,
      b.w * 0.55,
      tile * 0.45,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // main wood plate
    ctx.save();
    rr(b.x - tile * 0.25, b.y - tile * 0.25, b.w + tile * 0.5, b.h + tile * 0.5, tile * 0.25);

    // “spotlight from bottom-left”
    const spot = ctx.createRadialGradient(
      b.x - tile * 0.2,          // bottom-left-ish
      b.y + b.h + tile * 0.5,
      tile * 0.5,
      b.x + b.w * 0.6,
      b.y + b.h * 0.3,
      b.w * 1.2
    );
    spot.addColorStop(0, "rgba(255,255,255,0.25)");
    spot.addColorStop(0.35, "rgba(255,255,255,0.10)");
    spot.addColorStop(1, "rgba(0,0,0,0.35)");

    // base wood tint (neutral so it works with your app bg)
    const wood = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
    wood.addColorStop(0, "rgba(30,55,90,0.55)");
    wood.addColorStop(1, "rgba(10,25,45,0.55)");

    ctx.fillStyle = wood;
    ctx.fill();
    ctx.clip();

    // spotlight overlay
    ctx.fillStyle = spot;
    ctx.fillRect(b.x - tile, b.y - tile, b.w + tile * 2, b.h + tile * 2);

    // thin rim highlight
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 2;
    rr(b.x - tile * 0.25, b.y - tile * 0.25, b.w + tile * 0.5, b.h + tile * 0.5, tile * 0.25);
    ctx.stroke();

    ctx.restore();
  }

  // Draw a raised wooden block (wall) with extrusion (3D look)
  function drawRaisedBlock(px, py, size, extrude) {
    const r = Math.max(4, size * 0.14);

    // shadow below block (casts to top-right a bit)
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    rr(px + extrude * 0.25, py + extrude * 0.55, size, size, r);
    ctx.fill();
    ctx.restore();

    // side faces (right + bottom)
    ctx.save();
    // right face
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.moveTo(px + size, py);
    ctx.lineTo(px + size + extrude, py + extrude * 0.55);
    ctx.lineTo(px + size + extrude, py + size + extrude * 0.55);
    ctx.lineTo(px + size, py + size);
    ctx.closePath();
    ctx.fill();

    // bottom face
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.moveTo(px, py + size);
    ctx.lineTo(px + extrude, py + size + extrude * 0.55);
    ctx.lineTo(px + size + extrude, py + size + extrude * 0.55);
    ctx.lineTo(px + size, py + size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // top face (light wood)
    ctx.save();
    const top = ctx.createLinearGradient(px, py, px + size, py + size);
    top.addColorStop(0, "rgba(255,255,255,0.20)"); // light from bottom-left
    top.addColorStop(0.4, "rgba(255,255,255,0.08)");
    top.addColorStop(1, "rgba(0,0,0,0.18)");

    rr(px, py, size, size, r);
    ctx.fillStyle = "rgba(20,40,70,0.55)";
    ctx.fill();

    ctx.fillStyle = top;
    ctx.fill();

    // bevel line
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    rr(px + 1, py + 1, size - 2, size - 2, r);
    ctx.stroke();

    ctx.restore();
  }

  // Engraved trench floor (walkable)
  function drawTrenchFloor(px, py, size, inset) {
    // base dark trench
    ctx.save();

    // slight vertical shading
    const g = ctx.createLinearGradient(px, py, px, py + size);
    g.addColorStop(0, "rgba(0,0,0,0.32)");
    g.addColorStop(1, "rgba(0,0,0,0.55)");

    // use texture if available, but keep subtle
    ctx.fillStyle = trenchPattern || "rgba(0,0,0,0.45)";
    ctx.globalAlpha = trenchPattern ? 0.35 : 1;
    ctx.fillRect(px, py, size, size);

    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.fillRect(px, py, size, size);

    // inner lip highlight + shadow (engraved)
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(px + inset, py + inset, size - inset * 2, 2);

    ctx.fillStyle = "rgba(0,0,0,0.40)";
    ctx.fillRect(px + inset, py + size - inset - 2, size - inset * 2, 2);

    ctx.restore();
  }

  function drawPaintedPath(px, py, size, inset, time) {
    // clean liquid (no glow spam)
    const grad = ctx.createLinearGradient(px, py, px, py + size);
    grad.addColorStop(0, "#5fe6ff");
    grad.addColorStop(0.5, "#25d7ff");
    grad.addColorStop(1, "#0a6a8f");

    ctx.save();
    rr(px + inset, py + inset, size - inset * 2, size - inset * 2, Math.max(4, size * 0.12));
    ctx.fillStyle = grad;
    ctx.fill();

    // subtle moving noise (very low)
    if (liquidPattern) {
      ctx.globalAlpha = 0.10;
      ctx.translate(Math.sin(time + px * 0.02) * 4, Math.cos(time + py * 0.02) * 4);
      ctx.fillStyle = liquidPattern;
      ctx.fillRect(px + inset - 30, py + inset - 30, size - inset * 2 + 60, size - inset * 2 + 60);
    }

    // small spec line
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "rgba(255,255,255,1)";
    ctx.fillRect(px + inset * 1.2, py + inset * 1.2, size - inset * 2.4, 2);

    ctx.restore();
  }

  function drawMaze() {
    ensurePatterns();

    const time = performance.now() * 0.001;

    // draw board base first (solid piece)
    drawBoardBase();

    const inset = Math.max(2, Math.floor(tile * 0.10));
    const extrude = Math.max(6, Math.floor(tile * 0.22));

    // ─────────────────────────────
    // PASS 1: TRENCH FLOOR (WALKABLE) — no seams (overlap)
    // ─────────────────────────────
    for (let y = 0; y < state.rows; y++) {
      for (let x = 0; x < state.cols; x++) {
        if (state.grid[y][x] === 1) continue;

        const px = ox + x * tile;
        const py = oy + y * tile;

        // overlap by 1px to kill seams
        drawTrenchFloor(px - 1, py - 1, tile + 2, inset);
      }
    }

    // ─────────────────────────────
    // PASS 2: RAISED WALLS (BLOCKS) — also no seams
    // ─────────────────────────────
    for (let y = 0; y < state.rows; y++) {
      for (let x = 0; x < state.cols; x++) {
        if (state.grid[y][x] !== 1) continue;

        const px = ox + x * tile;
        const py = oy + y * tile;

        // slightly overlap into neighbors so no grid lines
        drawRaisedBlock(px - 1, py - 1, tile + 2, extrude);
      }
    }

    // ─────────────────────────────
    // PASS 3: PAINTED PATH (VISITED)
    // ─────────────────────────────
    for (let y = 0; y < state.rows; y++) {
      for (let x = 0; x < state.cols; x++) {
        if (!state.isPainted(x, y)) continue;
        if (state.grid[y][x] === 1) continue;

        const px = ox + x * tile;
        const py = oy + y * tile;

        drawPaintedPath(px - 1, py - 1, tile + 2, inset + 1, time);
      }
    }

    // ─────────────────────────────
    // PASS 4: EDGE SHADOWS between trench and walls (depth)
    // light from bottom-left => shadows go top-right
    // ─────────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.55;

    for (let y = 0; y < state.rows; y++) {
      for (let x = 0; x < state.cols; x++) {
        if (state.grid[y][x] === 1) continue;

        const px = ox + x * tile;
        const py = oy + y * tile;

        // if neighbor is wall, draw inner shadow on that edge
        // top neighbor wall => shadow at top edge of trench
        if (y > 0 && state.grid[y - 1][x] === 1) {
          ctx.fillStyle = "rgba(0,0,0,0.45)";
          ctx.fillRect(px, py, tile, inset + 2);
        }
        // left neighbor wall
        if (x > 0 && state.grid[y][x - 1] === 1) {
          ctx.fillStyle = "rgba(0,0,0,0.38)";
          ctx.fillRect(px, py, inset + 2, tile);
        }
        // bottom neighbor wall => a tiny highlight (light from bottom-left)
        if (y < state.rows - 1 && state.grid[y + 1][x] === 1) {
          ctx.fillStyle = "rgba(255,255,255,0.06)";
          ctx.fillRect(px, py + tile - (inset + 2), tile, inset + 2);
        }
        // right neighbor wall => tiny highlight
        if (x < state.cols - 1 && state.grid[y][x + 1] === 1) {
          ctx.fillStyle = "rgba(255,255,255,0.05)";
          ctx.fillRect(px + tile - (inset + 2), py, inset + 2, tile);
        }
      }
    }

    ctx.restore();
  }

  function drawBall(playerFloat) {
    const r = Math.max(10, tile * 0.24);
    const c = cellCenter(playerFloat.x, playerFloat.y);
    const t = performance.now() * 0.001;

    const dx = playerFloat.vx || 0;
    const dy = playerFloat.vy || 0;
    const len = Math.hypot(dx, dy) || 1;
    const mx = dx / len;
    const my = dy / len;

    // contact shadow
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.ellipse(c.cx + r * 0.25, c.cy + r * 0.75, r * 1.15, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // gold metal gradient (FIXED: was red in your pasted block)
    const lx = c.cx - r * (0.65 + mx * 0.35);
    const ly = c.cy - r * (0.65 + my * 0.35);

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

    // brushed arcs
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = (t * 2 + i) % (Math.PI * 2);
      ctx.beginPath();
      ctx.arc(c.cx, c.cy, r * 0.9, a, a + Math.PI * 0.12);
      ctx.stroke();
    }
    ctx.restore();

    // rim shade
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = r * 0.22;
    ctx.beginPath();
    ctx.arc(c.cx, c.cy, r - ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.stroke();

    // specular hotspot
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath();
    ctx.ellipse(c.cx - r * 0.45, c.cy - r * 0.5, r * 0.22, r * 0.18, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // secondary reflection
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.ellipse(c.cx + r * 0.28, c.cy + r * 0.12, r * 0.5, r * 0.32, 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  function render(playerFloat) {
    // IMPORTANT: do not double-clear in ways that erase board+ball
    ctx.clearRect(0, 0, w, h);

    drawBackground();
    drawMaze();
    drawBall(playerFloat);
  }

  return { resize, render };
}