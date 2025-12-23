// src/game/render.js



export function createRenderer({ canvas, state }) {

  const ctx = canvas.getContext("2d");



  let w = 0;

  let h = 0;

  let tile = 32;

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



    tile = Math.floor(Math.min(w / state.cols, h / state.rows));

    ox = Math.floor((w - state.cols * tile) / 2);

    oy = Math.floor((h - state.rows * tile) / 2);

  }



  function cellToPx(x, y) {

    return {

      cx: ox + x * tile + tile / 2,

      cy: oy + y * tile + tile / 2,

    };

  }



  function drawBackground() {

    ctx.fillStyle = "rgba(0,0,0,0.18)";

    ctx.fillRect(0, 0, w, h);

  }



  function drawGrid() {

    for (let y = 0; y < state.rows; y++) {

      for (let x = 0; x < state.cols; x++) {

        const v = state.grid[y][x];

        const px = ox + x * tile;

        const py = oy + y * tile;



        // wall

        if (v === 1) {

          ctx.fillStyle = "rgba(0,0,0,0.55)";

          ctx.fillRect(px, py, tile, tile);

          continue;

        }



        // walkable base

        ctx.fillStyle = "rgba(255,255,255,0.08)";

        ctx.fillRect(px, py, tile, tile);



        // painted overlay

        const k = x + "," + y;

        if (state.painted.has(k)) {

          ctx.fillStyle = "rgba(37,215,255,0.22)";

          ctx.fillRect(px + 2, py + 2, tile - 4, tile - 4);

        }



        // goal tile (optional, if you have 2)

        if (v === 2) {

          ctx.strokeStyle = "rgba(255,210,120,0.55)";

          ctx.lineWidth = 2;

          ctx.strokeRect(px + 4, py + 4, tile - 8, tile - 8);

        }

      }

    }

  }



  function drawPlayer() {

    const p = cellToPx(state.renderPos.x, state.renderPos.y);

    const r = Math.max(10, tile * 0.22);



    // shadow

    ctx.fillStyle = "rgba(0,0,0,0.28)";

    ctx.beginPath();

    ctx.ellipse(p.cx + 2, p.cy + 6, r * 1.05, r * 0.85, 0, 0, Math.PI * 2);

    ctx.fill();



    // ball

    ctx.fillStyle = "#25d7ff";

    ctx.beginPath();

    ctx.arc(p.cx, p.cy, r, 0, Math.PI * 2);

    ctx.fill();



    // highlight

    ctx.fillStyle = "rgba(255,255,255,0.35)";

    ctx.beginPath();

    ctx.arc(p.cx - r * 0.25, p.cy - r * 0.25, r * 0.45, 0, Math.PI * 2);

    ctx.fill();

  }



  function render() {

    ctx.clearRect(0, 0, w, h);

    drawBackground();

    drawGrid();

    drawPlayer();

  }



  return { resize, render };

}