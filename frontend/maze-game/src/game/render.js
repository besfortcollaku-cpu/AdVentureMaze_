// src/game/render.js

export function createRenderer({ canvas, state }) {
  const ctx = canvas.getContext("2d");

  let w = 0;
  let h = 0;
  let tile = 64;
  let ox = 0;
  let oy = 0;

  // ─────────────────────────────
  // LOAD SPRITES
  // ─────────────────────────────
  const sprites = {};
  const spriteList = [
    "crystal_tile",
    "crystal_inner",
    "crystal_side",
    "crystal_corner_glow",
    "crystal_shadow",
    "floor_edge",
    "wall_center",
    "wall_corner",
    "ball",
  ];

  spriteList.forEach((name) => {
    const img = new Image();
    img.src = `/textures/sprites/crystal/${name}.png`;
    sprites[name] = img;
  });

  // ─────────────────────────────
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    w = rect.width;
    h = rect.height;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const base = Math.min(w / state.cols, h / state.rows);
    tile = Math.max(48, Math.floor(base));
    ox = Math.floor((w - state.cols * tile) / 2);
    oy = Math.floor((h - state.rows * tile) / 2);
  }

  // ─────────────────────────────
  function drawBackground() {
    ctx.clearRect(0, 0, w, h);
  }

  // ─────────────────────────────
  // FLOOR (CONTINUOUS – NO GRID)
  // ─────────────────────────────
  function drawFloor() {
    for (let y = 0; y < state.rows; y++) {
      for (let x = 0; x < state.cols; x++) {
        if (state.grid[y][x] === 0 || state.isPainted(x, y)) {
          const px = ox + x * tile;
          const py = oy + y * tile;

          ctx.drawImage(
            sprites.crystal_tile,
            px - 1,
            py - 1,
            tile + 2,
            tile + 2
          );
        }
      }
    }
  }

  // ─────────────────────────────
  // WALLS (DEPTH FEEL)
  // ─────────────────────────────
  function drawWalls() {
    const depth = tile * 0.25;

    for (let y = 0; y < state.rows; y++) {
      for (let x = 0; x < state.cols; x++) {
        if (state.grid[y][x] !== 1) continue;

        const px = ox + x * tile;
        const py = oy + y * tile;

        // shadow
        ctx.drawImage(
          sprites.crystal_shadow,
          px,
          py + depth,
          tile,
          tile * 0.6
        );

        // wall body
        ctx.drawImage(
          sprites.wall_center,
          px,
          py - depth,
          tile,
          tile
        );
      }
    }
  }

  // ─────────────────────────────
  // BALL
  // ─────────────────────────────
  function drawBall(player) {
    const px = ox + player.x * tile;
    const py = oy + player.y * tile;

    const size = tile * 0.8;
    const offset = (tile - size) / 2;

    ctx.drawImage(
      sprites.crystal_shadow,
      px + offset,
      py + offset + tile * 0.35,
      size,
      size * 0.5
    );

    ctx.drawImage(
      sprites.ball,
      px + offset,
      py + offset - tile * 0.15,
      size,
      size
    );
  }

  // ─────────────────────────────
  function render(player) {
    drawBackground();
    drawFloor();
    drawWalls();
    drawBall(player);
  }

  return { resize, render };
}