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
  if (!player) return;

  ctx.clearRect(0, 0, w, h);
  drawBackground();
  drawMaze();

  // ✅ SAFE BALL DRAW (matches old engine contract)
  const px = player.x * tileSize + tileSize / 2;
  const py = player.y * tileSize + tileSize / 2;

  ctx.fillStyle = BALL_COLOR;
  ctx.beginPath();
  ctx.arc(px, py, tileSize * 0.35, 0, Math.PI * 2);
  ctx.fill();
}
  resize();
  return {
    resize,
    render,
  };
}