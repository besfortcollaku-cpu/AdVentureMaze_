// src/game/render.js

const WALL_COLOR = "#0e1b2c";        // same as app background
const PATH_BASE = "#16273f";        // carved channel
const PATH_FILLED = "#1f3b5f";      // painted path
const BALL_COLOR = "#4fd1ff";
const GLOW_COLOR = "rgba(80,160,255,0.35)";

let paintedPath = new Set(); // remembers where the ball passed

function key(x, y) {
  return `${x},${y}`;
}

export function render(ctx, state) {
  const { grid, ball, tileSize } = state;

  // 🔥 CLEAR CANVAS COMPLETELY (transparent)
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // 🧱 DRAW WALLS
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] === 1) {
        const px = x * tileSize;
        const py = y * tileSize;

        ctx.fillStyle = WALL_COLOR;
        ctx.fillRect(px, py, tileSize, tileSize);
      }
    }
  }

  // 🛣️ DRAW BASE PATH (engraved channel)
  ctx.save();
  ctx.fillStyle = PATH_BASE;
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = tileSize * 0.25;

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] === 0) {
        ctx.fillRect(
          x * tileSize,
          y * tileSize,
          tileSize,
          tileSize
        );
      }
    }
  }
  ctx.restore();

  // 🧩 MARK BALL POSITION AS PAINTED
  const bx = Math.floor(ball.x / tileSize);
  const by = Math.floor(ball.y / tileSize);
  paintedPath.add(key(bx, by));

  // 🎨 DRAW PAINTED PATH (smooth, no tiles)
  ctx.save();
  ctx.fillStyle = PATH_FILLED;

  paintedPath.forEach((k) => {
    const [x, y] = k.split(",").map(Number);
    ctx.fillRect(
      x * tileSize,
      y * tileSize,
      tileSize,
      tileSize
    );
  });
  ctx.restore();

  // ✨ ACTIVE GLOW AROUND BALL
  ctx.save();
  const glowRadius = tileSize * 0.9;
  const gradient = ctx.createRadialGradient(
    ball.x,
    ball.y,
    0,
    ball.x,
    ball.y,
    glowRadius
  );
  gradient.addColorStop(0, GLOW_COLOR);
  gradient.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, glowRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ⚪ DRAW BALL
  ctx.save();
  ctx.fillStyle = BALL_COLOR;
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = tileSize * 0.3;

  ctx.beginPath();
  ctx.arc(ball.x, ball.y, tileSize * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
// 👇 Adapter for existing game.js (DO NOT REMOVE)
export function createRenderer(ctx, state) {
  return {
    render() {
      render(ctx, state);
    },
  };
}