export function createGame({ canvas }) {

  const ctx = canvas.getContext("2d");



  function resizeCanvas() {

    const rect = canvas.getBoundingClientRect();

    const dpr = Math.min(2, window.devicePixelRatio || 1);



    canvas.width = rect.width * dpr;

    canvas.height = rect.height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  }



  function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);



    // TEMP visual proof

    ctx.fillStyle = "#25d7ff";

    ctx.beginPath();

    ctx.arc(

      canvas.width / 2 / devicePixelRatio,

      canvas.height / 2 / devicePixelRatio,

      24,

      0,

      Math.PI * 2

    );

    ctx.fill();

  }



  function loop() {

    draw();

    requestAnimationFrame(loop);

  }



  return {

    start() {

      requestAnimationFrame(() => {

        resizeCanvas();

        requestAnimationFrame(loop);

      });

    },

  };

}