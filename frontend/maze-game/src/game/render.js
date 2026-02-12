export function createRenderer({ canvas, state }) {
  let shakeStrength = 0;
  let shakeDuration = 0;
  let shakeStart = 0;

  const ctx = canvas.getContext("2d");

  let w = 0;
  let h = 0;
  let tile = 48;
  let ox = 0;
  let oy = 0;

  function triggerShake(strength = 4, duration = 500) {
    shakeStrength = strength;
    shakeDuration = duration;
    shakeStart = performance.now();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    w = rect.width;
    h = rect.height;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    tile = Math.floor(Math.min(w / state.cols, h / state.rows));
    ox = Math.floor((w - state.cols * tile) / 2);
    oy = Math.floor((h - state.rows * tile) / 2);
  }

  window.addEventListener("resize", resize);
  resize();

  function render(playerFloat) {
    ctx.clearRect(0, 0, w, h);

    let dx = 0;
    let dy = 0;

    if (shakeStart) {
      const elapsed = performance.now() - shakeStart;
      if (elapsed < shakeDuration) {
        const p = 1 - elapsed / shakeDuration;
        dx = (Math.random() - 0.5) * shakeStrength * p;
        dy = (Math.random() - 0.5) * shakeStrength * p;
      } else {
        shakeStart = 0;
      }
    }

    ctx.save();
    ctx.translate(dx, dy);

    // draw calls
    drawBackground();
    drawFloor();
    drawBall(playerFloat);
    drawWalls();

    ctx.restore();
  }

  return {
    resize,
    render,
    triggerShake, // ✅ THIS is how others access it
  };
}