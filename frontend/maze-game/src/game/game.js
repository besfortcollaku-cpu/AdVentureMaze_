// src/game/game.js
// ✅ VISUAL UPGRADE ONLY (logic unchanged)
// ✅ No zoom (STEP 13 undone)
// ✅ setLevel(level) works
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

  // ---------- level state ----------
  let grid, rows, cols, start;
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

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    w = rect.width;
    h = rect.height;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // ✅ SAME sizing for every level (no zoom)
    const baseTile = Math.min(w / cols, h / rows);
    tile = Math.max(18, Math.floor(baseTile));
  }

  function loadLevel(lvl) {
    grid = lvl.grid;
    rows = grid.length;
    cols = grid[0].length;
    start = lvl.start || { x: 1, y: 1 };

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

  // ---------- drawing (VISUALS ONLY) ----------
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

  function drawBackground(now) {
    // dark gradient background + soft glow
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#0b1224");
    g.addColorStop(1, "#070b14");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // corner glow (cyan)
    ctx.save();
    ctx.globalAlpha = 0.18;
    const r = Math.max(w, h) * 0.9;
    const rad = ctx.createRadialGradient(w * 0.25, h * 0.12, 0, w * 0.25, h * 0.12, r);
    rad.addColorStop(0, "rgba(37,215,255,0.55)");
    rad.addColorStop(1, "rgba(37,215,255,0)");
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // subtle moving grain
    const t = (now || 0) * 0.0006;
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    for (let i = 0; i < 90; i++) {
      const x = (Math.sin(i * 12.989 + t) * 43758.5453) % 1;
      const y = (Math.cos(i * 78.233 + t) * 12345.6789) % 1;
      const px = (x < 0 ? x + 1 : x) * w;
      const py = (y < 0 ? y + 1 : y) * h;
      ctx.fillRect(px, py, 1, 1);
    }
    ctx.restore();
  }

  function drawGrid(now) {
    const innerPad = Math.max(1, Math.floor(tile * 0.08));
    const gridStroke = "rgba(255,255,255,0.05)";

    // painted glow anim
    const pulse = 0.5 + 0.5 * Math.sin((now || 0) * 0.004);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = ox + x * tile;
        const py = oy + y * tile;

        const cell = grid[y][x];

        if (cell === 1) {
          // WALL: bevel + darker core
          ctx.fillStyle = "rgba(0,0,0,0.45)";
          ctx.fillRect(px, py, tile, tile);

          // bevel highlight top/left
          ctx.fillStyle = "rgba(255,255,255,0.06)";
          ctx.fillRect(px, py, tile, Math.max(1, Math.floor(tile * 0.10)));
          ctx.fillRect(px, py, Math.max(1, Math.floor(tile * 0.10)), tile);

          // bevel shadow bottom/right
          ctx.fillStyle = "rgba(0,0,0,0.22)";
          ctx.fillRect(px, py + tile - Math.max(1, Math.floor(tile * 0.10)), tile, Math.max(1, Math.floor(tile * 0.10)));
          ctx.fillRect(px + tile - Math.max(1, Math.floor(tile * 0.10)), py, Math.max(1, Math.floor(tile * 0.10)), tile);

          // outline
          ctx.strokeStyle = "rgba(255,255,255,0.03)";
          ctx.strokeRect(px + 0.5, py + 0.5, tile - 1, tile - 1);
          continue;
        }

        if (!isPassable(x, y)) continue;

        // WALKABLE base
        ctx.fillStyle = "rgba(255,255,255,0.05)";
        ctx.fillRect(px, py, tile, tile);

        // Painted overlay (glowy inset)
        if (painted.has(key(x, y))) {
          ctx.save();
          ctx.globalAlpha = 0.22 + pulse * 0.10;
          ctx.fillStyle = "rgba(37,215,255,1)";
          ctx.fillRect(px + innerPad, py + innerPad, tile - innerPad * 2, tile - innerPad * 2);
          ctx.restore();

          // soft glow
          ctx.save();
          ctx.globalAlpha = 0.12 + pulse * 0.06;
          ctx.fillStyle = "rgba(37,215,255,1)";
          ctx.fillRect(px - 1, py - 1, tile + 2, tile + 2);
          ctx.restore();
        }

        // GOAL tile (value 2) — golden shimmer
        if (cell === 2) {
          const g = ctx.createLinearGradient(px, py, px + tile, py + tile);
          g.addColorStop(0, "rgba(255,220,120,0.10)");
          g.addColorStop(1, "rgba(255,180,60,0.18)");
          ctx.fillStyle = g;
          ctx.fillRect(px, py, tile, tile);

          // small star/dot
          ctx.save();
          ctx.globalAlpha = 0.6 + 0.2 * pulse;
          ctx.fillStyle = "rgba(255,204,51,0.9)";
          ctx.beginPath();
          ctx.arc(px + tile * 0.55, py + tile * 0.45, Math.max(2, tile * 0.08), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // outline
        ctx.strokeStyle = gridStroke;
        ctx.strokeRect(px + 0.5, py + 0.5, tile - 1, tile - 1);
      }
    }
  }

  function drawBall(px, py, progress) {
    const r = Math.max(10, tile * 0.22);
    const bounce = Math.sin(progress * Math.PI) * (tile * 0.10);

    // shadow (soft)
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.ellipse(ox + px + 2, oy + py + 7, r * 1.18, r * 0.85, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.restore();

    const cx = ox + px;
    const cy = oy + py - bounce;

    // glow
    ctx.save();
    ctx.globalAlpha = 0.20;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.55, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(37,215,255,1)";
    ctx.fill();
    ctx.restore();

    // ball gradient
    const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.2, cx, cy, r * 1.2);
    g.addColorStop(0, "#bff6ff");
    g.addColorStop(0.35, "#25d7ff");
    g.addColorStop(1, "#0076a8");

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    // crisp rim
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = Math.max(1, r * 0.10);
    ctx.stroke();

    // highlight
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(cx - r * 0.35, cy - r * 0.42, r * 0.38, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.restore();
  }

  function drawHUD() {
    // small pill top-left (subtle)
    const text = `Painted: ${painted.size}/${totalPassable}`;
    ctx.save();
    ctx.font = "13px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    const padX = 10;
    const padY = 7;
    const tw = ctx.measureText(text).width;
    const bw = tw + padX * 2;
    const bh = 28;

    const x = 10;
    const y = 10;

    // background
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    roundRect(ctx, x, y, bw, bh, 12);
    ctx.fill();

    // border
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    roundRect(ctx, x + 0.5, y + 0.5, bw - 1, bh - 1, 12);
    ctx.stroke();

    // text
    ctx.fillStyle = "rgba(234,243,255,0.90)";
    ctx.globalAlpha = 1;
    ctx.fillText(text, x + padX, y + 19);
    ctx.restore();
  }

  function draw(now) {
    ctx.clearRect(0, 0, w, h);

    drawBackground(now);

    const p = getAnimatedPlayer(now);
    updateCamera(p.px, p.py);

    drawGrid(now);
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

  function roundRect(ctx2, x, y, w2, h2, r) {
    const rr = Math.min(r, w2 / 2, h2 / 2);
    ctx2.beginPath();
    ctx2.moveTo(x + rr, y);
    ctx2.arcTo(x + w2, y, x + w2, y + h2, rr);
    ctx2.arcTo(x + w2, y + h2, x, y + h2, rr);
    ctx2.arcTo(x, y + h2, x, y, rr);
    ctx2.arcTo(x, y, x + w2, y, rr);
    ctx2.closePath();
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
