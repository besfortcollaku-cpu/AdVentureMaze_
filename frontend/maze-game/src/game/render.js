// src/game/render.js



export function createRenderer({ canvas, state, level }) {

  const ctx = canvas.getContext("2d");



  // canvas css size (not DPR size)

  let w = 0;

  let h = 0;



  // board layout

  let tile = 40; // size of one cell in CSS px (auto-fit)

  let ox = 0;

  let oy = 0;



  // ✅ ball stays consistent on screen (CSS px)

  const BALL_RADIUS_PX = 22;



  function resize() {

    const rect = canvas.getBoundingClientRect();

    const dpr = Math.min(2, window.devicePixelRatio || 1);



    w = rect.width;

    h = rect.height;



    canvas.width = Math.floor(w * dpr);

    canvas.height = Math.floor(h * dpr);



    // draw in CSS px coords

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);



    // ✅ Auto-fit maze to screen with padding

    const pad = Math.max(10, Math.floor(Math.min(w, h) * 0.04));

    const usableW = Math.max(10, w - pad * 2);

    const usableH = Math.max(10, h - pad * 2);



    // optional zoom factor per level (default 1)

    const zoom = typeof level?.zoom === "number" ? level.zoom : 1;



    tile = Math.floor(

      Math.min(usableW / state.cols, usableH / state.rows) * zoom

    );



    // prevent zero / too small tile

    tile = Math.max(10, tile);



    ox = Math.floor((w - state.cols * tile) / 2);

    oy = Math.floor((h - state.rows * tile) / 2);

  }



  function cellCenter(x, y) {

    return {

      cx: ox + x * tile + tile / 2,

      cy: oy + y * tile + tile / 2,

    };

  }



  function clear() {

    ctx.clearRect(0, 0, w, h);

  }



  function drawBackground() {

    // simple dark board background so you always see render

    ctx.fillStyle = "rgba(0,0,0,0.25)";

    ctx.fillRect(0, 0, w, h);

  }



  function drawGrid() {

    // draw walls + floor

    for (let y = 0; y < state.rows; y++) {

      for (let x = 0; x < state.cols; x++) {

        const isWall = state.grid[y][x] === 1;



        const px = ox + x * tile;

        const py = oy + y * tile;



        if (isWall) {

          ctx.fillStyle = "rgba(0,0,0,0.55)";

          ctx.fillRect(px, py, tile, tile);

        } else {

          ctx.fillStyle = "rgba(255,255,255,0.06)";

          ctx.fillRect(px, py, tile, tile);

        }

      }

    }

  }



  function drawPainted() {

    // paint tiles user visited

    for (const k of state.painted) {

      const [xs, ys] = k.split(",");

      const x = parseInt(xs, 10);

      const y = parseInt(ys, 10);



      const px = ox + x * tile;

      const py = oy + y * tile;



      // glow

      ctx.fillStyle = "rgba(37,215,255,0.18)";

      ctx.fillRect(px, py, tile, tile);



      // inner

      ctx.fillStyle = "rgba(37,215,255,0.08)";

      ctx.fillRect(px + 2, py + 2, tile - 4, tile - 4);

    }

  }



  function drawBall() {

    const { cx, cy } = cellCenter(state.playerX, state.playerY);



    // shadow

    ctx.fillStyle = "rgba(0,0,0,0.35)";

    ctx.beginPath();

    ctx.ellipse(cx + 2, cy + 6, BALL_RADIUS_PX * 1.05, BALL_RADIUS_PX * 0.72, 0, 0, Math.PI * 2);

    ctx.fill();



    // ball

    ctx.fillStyle = "#25d7ff";

    ctx.beginPath();

    ctx.arc(cx, cy, BALL_RADIUS_PX, 0, Math.PI * 2);

    ctx.fill();



    // highlight

    ctx.fillStyle = "rgba(255,255,255,0.55)";

    ctx.beginPath();

    ctx.arc(cx - BALL_RADIUS_PX * 0.35, cy - BALL_RADIUS_PX * 0.35, BALL_RADIUS_PX * 0.35, 0, Math.PI * 2);

    ctx.fill();

  }



  function drawHUD() {

    const s = state.getStats();

    ctx.fillStyle = "rgba(255,255,255,0.8)";

    ctx.font = "13px Arial";

    ctx.fillText(`Tiles: ${s.painted}/${s.total}`, 12, 20);

  }



  function render() {

    clear();

    drawBackground();

    drawGrid();

    drawPainted();

    drawBall();

    drawHUD();

  }



  return {

    resize,

    render,

  };

}