// src/game/game.js
// Renders a tile maze from level.map and supports swipe + arrow movement.

export function createGame({
  canvas,
  level,
  // optional extras (safe if provided from main.js)
  BACKEND,
  getCurrentUser,
} = {}) {
  const ctx = canvas.getContext("2d");

  // --- parse level map ---
  const raw = level?.map ?? level?.MAP ?? level?.grid ?? level?.tiles;

  const mapLines = normalizeMap(raw);
  if (!mapLines.length) {
    console.warn("[createGame] level.map is missing or empty.", level);
  }

  const rows = mapLines.length;
  const cols = mapLines[0]?.length ?? 0;

  // find start/goal
  let player = findChar(mapLines, ["S", "P"]) || { r: 1, c: 1 };
  const goal = findChar(mapLines, ["G", "E"]) || { r: rows - 2, c: cols - 2 };

  // make sure start is on empty
  if (isWall(mapLines, player.r, player.c)) {
    const empty = findFirstEmpty(mapLines);
    if (empty) player = empty;
  }

  // --- rendering sizes ---
  let w = 0; // css px
  let h = 0; // css px
  let tile = 24; // css px per tile (auto fit)
  let offsetX = 0;
  let offsetY = 0;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    w = rect.width;
    h = rect.height;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Fit map inside canvas with padding
    const pad = 18;
    const availW = Math.max(10, w - pad * 2);
    const availH = Math.max(10, h - pad * 2);

    if (cols > 0 && rows > 0) {
      tile = Math.floor(Math.min(availW / cols, availH / rows));
      tile = clamp(tile, 10, 44);
      offsetX = Math.floor((w - cols * tile) / 2);
      offsetY = Math.floor((h - rows * tile) / 2);
    } else {
      tile = 24;
      offsetX = Math.floor((w - tile) / 2);
      offsetY = Math.floor((h - tile) / 2);
    }
  }

  // --- movement ---
  let won = false;

  function tryMove(dr, dc) {
    if (won) return;

    const nr = player.r + dr;
    const nc = player.c + dc;

    if (isWall(mapLines, nr, nc)) return;

    player = { r: nr, c: nc };

    if (player.r === goal.r && player.c === goal.c) {
      won = true;
      console.log("WIN!");
    }
  }

  function onKeyDown(e) {
    const k = e.key;
    if (k === "ArrowUp") tryMove(-1, 0);
    else if (k === "ArrowDown") tryMove(1, 0);
    else if (k === "ArrowLeft") tryMove(0, -1);
    else if (k === "ArrowRight") tryMove(0, 1);
  }

  // swipe controls
  let touchStart = null;

  function onTouchStart(e) {
    if (!e.touches || e.touches.length === 0) return;
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY, time: Date.now() };
  }

  function onTouchEnd(e) {
    if (!touchStart) return;

    // changedTouches for end
    const t = (e.changedTouches && e.changedTouches[0]) || null;
    if (!t) return;

    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    // minimum swipe distance
    const min = 26;
    if (absX < min && absY < min) {
      touchStart = null;
      return;
    }

    if (absX > absY) {
      tryMove(0, dx > 0 ? 1 : -1);
    } else {
      tryMove(dy > 0 ? 1 : -1, 0);
    }

    touchStart = null;
  }

  // --- draw ---
  function drawBackground() {
    ctx.clearRect(0, 0, w, h);

    // subtle bg
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(0, 0, w, h);
  }

  function drawMaze() {
    if (!rows || !cols) {
      // fallback message
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "14px Arial";
      ctx.fillText("No level.map found", 12, 22);
      return;
    }

    // draw tiles
    for (let r = 0; r < rows; r++) {
      const line = mapLines[r];
      for (let c = 0; c < cols; c++) {
        const ch = line[c] ?? " ";
        const x = offsetX + c * tile;
        const y = offsetY + r * tile;

        if (isWallChar(ch)) {
          // wall
          ctx.fillStyle = "rgba(10, 18, 28, 0.9)";
          ctx.fillRect(x, y, tile, tile);

          // wall border glow
          ctx.strokeStyle = "rgba(37,215,255,0.12)";
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, tile - 1, tile - 1);
        } else {
          // floor
          ctx.fillStyle = "rgba(255,255,255,0.03)";
          ctx.fillRect(x, y, tile, tile);
        }
      }
    }

    // goal
    {
      const gx = offsetX + goal.c * tile + tile / 2;
      const gy = offsetY + goal.r * tile + tile / 2;

      ctx.fillStyle = "rgba(255, 215, 0, 0.95)";
      ctx.beginPath();
      ctx.arc(gx, gy, Math.max(6, tile * 0.22), 0, Math.PI * 2);
      ctx.fill();
    }

    // player
    {
      const px = offsetX + player.c * tile + tile / 2;
      const py = offsetY + player.r * tile + tile / 2;

      ctx.fillStyle = "#25d7ff";
      ctx.beginPath();
      ctx.arc(px, py, Math.max(7, tile * 0.26), 0, Math.PI * 2);
      ctx.fill();
    }

    // status text
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "14px Arial";
    ctx.fillText(won ? "✅ LEVEL COMPLETE" : "Swipe / Arrows to move", 12, 22);
  }

  function draw() {
    drawBackground();
    drawMaze();
  }

  let raf = null;
  function loop() {
    draw();
    raf = requestAnimationFrame(loop);
  }

  // --- public api ---
  return {
    start() {
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);

      // inputs
      window.addEventListener("keydown", onKeyDown);
      canvas.addEventListener("touchstart", onTouchStart, { passive: true });
      canvas.addEventListener("touchend", onTouchEnd, { passive: true });

      // also allow swipe anywhere on document (helps Pi Browser)
      document.addEventListener("touchstart", onTouchStart, { passive: true });
      document.addEventListener("touchend", onTouchEnd, { passive: true });

      raf = requestAnimationFrame(loop);
    },

    stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = null;

      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    },
  };
}

/* ---------------- helpers ---------------- */

function normalizeMap(raw) {
  if (!raw) return [];

  // If it's already an array of strings
  if (Array.isArray(raw)) {
    const lines = raw.map((x) => String(x));
    return fixRect(lines);
  }

  // If it's a single string with newlines
  if (typeof raw === "string") {
    const lines = raw
      .replace(/\r/g, "")
      .split("\n")
      .map((s) => s.trimEnd())
      .filter((s) => s.length > 0);
    return fixRect(lines);
  }

  // Unknown shape
  return [];
}

function fixRect(lines) {
  const maxLen = Math.max(0, ...lines.map((l) => l.length));
  return lines.map((l) => (l.length < maxLen ? l + " ".repeat(maxLen - l.length) : l));
}

function isWall(mapLines, r, c) {
  if (r < 0 || c < 0) return true;
  if (r >= mapLines.length) return true;
  const line = mapLines[r];
  if (!line || c >= line.length) return true;
  return isWallChar(line[c]);
}

function isWallChar(ch) {
  // Common wall symbols
  return ch === "#" || ch === "X" || ch === "█" || ch === "1";
}

function findChar(lines, chars) {
  for (let r = 0; r < lines.length; r++) {
    const line = lines[r];
    for (let c = 0; c < line.length; c++) {
      if (chars.includes(line[c])) return { r, c };
    }
  }
  return null;
}

function findFirstEmpty(lines) {
  for (let r = 0; r < lines.length; r++) {
    const line = lines[r];
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (!isWallChar(ch) && ch !== undefined) return { r, c };
    }
  }
  return null;
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}