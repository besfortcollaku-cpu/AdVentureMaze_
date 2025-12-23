export function createGame({ canvas }) {

  const ctx = canvas.getContext("2d");



  let w = 0; // CSS px

  let h = 0; // CSS px



  function resizeCanvas() {

    const rect = canvas.getBoundingClientRect();

    const dpr = Math.min(2, window.devicePixelRatio || 1);



    w = rect.width;

    h = rect.height;



    canvas.width = Math.floor(w * dpr);

    canvas.height = Math.floor(h * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  }



  function draw() {

    ctx.clearRect(0, 0, w, h);



    // visible bg (proves it renders)

    ctx.fillStyle = "rgba(255,255,255,0.06)";

    ctx.fillRect(0, 0, w, h);



    // cyan ball

    ctx.fillStyle = "#25d7ff";

    ctx.beginPath();

    ctx.arc(w / 2, h / 2, 22, 0, Math.PI * 2);

    ctx.fill();



    // debug text

    ctx.fillStyle = "rgba(255,255,255,0.85)";

    ctx.font = "14px Arial";

    ctx.fillText("GAME LOOP RUNNING", 12, 22);

  }



  function loop() {

    draw();

    requestAnimationFrame(loop);

  }



  return {

    start() {

      resizeCanvas();

      window.addEventListener("resize", resizeCanvas);

      requestAnimationFrame(loop);

    },

  };

}