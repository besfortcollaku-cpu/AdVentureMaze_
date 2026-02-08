export function createRenderer({ canvas, state }) {
  const ctx = canvas.getContext("2d");

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const size = Math.min(
      canvas.parentElement.clientWidth,
      canvas.parentElement.clientHeight
    );

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function render(player) {
    const { grid, tileSize } = state;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // background (transparent = app background shows through)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw walls
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (grid[y][x] === 1) {
          ctx.fillStyle = "#1c2638"; // app background wall color
          ctx.fillRect(
            x * tileSize,
            y * tileSize,
            tileSize,
            tileSize
          );
        }
      }
    }

    // draw ball
    ctx.fillStyle = "#4dd2ff";
    ctx.beginPath();
    ctx.arc(
      player.x * tileSize + tileSize / 2,
      player.y * tileSize + tileSize / 2,
      tileSize * 0.35,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  resize();
  return {
    resize,
    render,
  };
}