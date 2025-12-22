export function createGame({ BACKEND, canvas, getCurrentUser, level }) {
  const ctx = canvas.getContext("2d");

  // --- Level fallback (so it never goes blank) ---
  const grid =
    level?.grid ||
    [
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

  const start = level?.start || { x: 1, y: 1 };
  const goal = level?.goal || findGoal(grid) || { x: cols - 2, y: rows - 2 };

  let player = { x: start.x, y: start.y };

  // --- sizing ---
  let tile = 40;
  let boardW = 0;
  let boardH = 0;
  let ox = 0;
  let oy = 0;

  // --- movement ---
  let moving = false;
  let moveQueue = [];
  const anim = { t0: 0, dur: 140, sx: start.x, sy: start.y, tx: start.x, ty: start.y };

  // --- swipe ---
  let touchStartX = 0;
  let touchStartY = 0;

  // --- autosave throttle ---
  let savePending = false;

  function isTrack(x, y) {
    return grid[y] && (grid[y][x] === 0 || grid[y][x] === 2);
  }

  function findGoal(g) {
    for (let y = 0; y < g.length; y++) {
      for (let x = 0; x < g[0].length; x++) {
        if (g[y][x] === 2) return { x, y };
      }
    }
    return null;
  }

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

  function cellCenter(x, y) {
    return {
      cx: ox + x * tile + tile / 2,
      cy: oy + y * tile + tile / 2,
    };
  }

  function requestMove(dx, dy) {
    if (moving) {
      moveQueue.push({ dx, dy });
      if (moveQueue.length > 3) moveQueue.shift();
      return;
    }

    const nx = player.x + dx;
    const ny = player.y + dy;
    if (!isTrack(nx, ny)) return;

    moving = true;
    anim.t0 = performance.now();
    anim.sx = player.x;
    anim.sy = player.y;
    anim.tx = nx;
    anim.ty = ny;

    // update cell immediately (like your old code)
    player.x = nx;
    player.y = ny;
  }

  function onMoveFinished() {
    moving = false;

    // autosave after a move
    queueSaveProgress();

    if (player.x === goal.x && player.y === goal.y) {
      setTimeout(() => alert("LEVEL COMPLETE!"), 60);
    }

    if (moveQueue.length > 0) {
      const m = moveQueue.shift();
      requestMove(m.dx, m.dy);
    }
  }

  function queueSaveProgress() {
    const u = getCurrentUser?.();
    if (!u?.username || u.username === "guest") return;
    if (savePending) return;

    savePending = true;
    setTimeout(async () => {
      savePending = false;
      try {
        await fetch(`${BACKEND}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: u.username,
            level: level?.id ?? 242,
            x: player.x,
            y: player.y,
            at: new Date().toISOString(),
          }),
        });
      } catch (e) {
        console.error("save progress failed", e);
      }
    }, 120);
  }

  function drawBoard() {
    // background
    ctx.clearRect(0, 0, boardW, boardH);
    ctx.fillStyle = "#0b1630";
    ctx.fillRect(0, 0, boardW, boardH);

    // draw cells
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = ox + x * tile;
        const py = oy + y * tile;

        if (grid[y][x] === 1) {
          ctx.fillStyle = "rgba(0,0,0,0.45)";
          ctx.fillRect(px, py, tile, tile);
        } else {
          ctx.fillStyle = "rgba(255,255,255,0.08)";
          ctx.fillRect(px, py, tile, tile);
        }

        if (grid[y][x] === 2) {
          ctx.fillStyle = "rgba(255,215,0,0.30)";
          ctx.beginPath();
          ctx.arc(px + tile/2, py + tile/2, tile*0.22, 0, Math.PI*2);
          ctx.fill();
        }
      }
    }
  }

  function getAnimatedPlayer(now) {
    if (!moving) {
      const c = cellCenter(player.x, player.y);
      return { px: c.cx, py: c.cy, progress: 0 };
    }

    const t = (now - anim.t0) / anim.dur;
    const clamped = Math.max(0, Math.min(1, t));
    const k = 1 - Math.pow(1 - clamped, 3);

    const sx = anim.sx + (anim.tx - anim.sx) * k;
    const sy = anim.sy + (anim.ty - anim.sy) * k;
    const c = cellCenter(sx, sy);
    return { px: c.cx, py: c.cy, progress: clamped };
  }

  function drawPlayer(now) {
    const p = getAnimatedPlayer(now);
    const r = tile * 0.22;

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.arc(p.px + 2, p.py + 4, r * 1.05, 0, Math.PI * 2);
    ctx.fill();

    const g = ctx.createRadialGradient(p.px - r*0.35, p.py - r*0.35, r*0.2, p.px, p.py, r);
    g.addColorStop(0, "#fff9d2");
    g.addColorStop(0.45, "#ffd95a");
    g.addColorStop(1, "#b87300");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.px, p.py, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function loop(now) {
    drawBoard();
    drawPlayer(now);

    if (moving) {
      const t = (now - anim.t0) / anim.dur;
      if (t >= 1) onMoveFinished();
    }

    requestAnimationFrame(loop);
  }

  function bindButtons() {
    document.getElementById("hintBtn")?.addEventListener("click", () => alert("Hint later 😉"));
    document.getElementById("x3Btn")?.addEventListener("click", () => alert("Boost later 😉"));
    document.getElementById("settings")?.addEventListener("click", () => alert("Settings later"));
    document.getElementById("controls")?.addEventListener("click", () => alert("Swipe to move"));
    document.getElementById("paint")?.addEventListener("click", () => alert("Paint shop later"));
    document.getElementById("trophy")?.addEventListener("click", () => alert("Trophies later"));
    document.getElementById("noads")?.addEventListener("click", () => alert("Remove ads later"));
  }

  // desktop keys (testing)
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") requestMove(0, -1);
    if (e.key === "ArrowDown") requestMove(0, 1);
    if (e.key === "ArrowLeft") requestMove(-1, 0);
    if (e.key === "ArrowRight") requestMove(1, 0);
  });

  // swipe
  canvas.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
    },
    { passive: true }
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
    { passive: true }
  );

  window.addEventListener("resize", resizeCanvas);

  return {
    start() {
      // important: do one resize now + one after layout
      resizeCanvas();
      requestAnimationFrame(() => {
        resizeCanvas();
        bindButtons();
        requestAnimationFrame(loop);
      });
    },
  };
}