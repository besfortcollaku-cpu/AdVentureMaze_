export function createGame({ BACKEND, canvas, getCurrentUser, level }) {

  const ctx = canvas.getContext("2d");



  let tile = 40;

  let boardW = 0;

  let boardH = 0;

  let ox = 0;

  let oy = 0;



  /* ------------------ Level data ------------------ */

  const grid = level.grid;

  const rows = grid.length;

  const cols = grid[0].length;



  const start = { x: level.start.x, y: level.start.y };

  let playerCell = { x: start.x, y: start.y };



  const goal = findGoal();

  function findGoal() {

    for (let y = 0; y < rows; y++) {

      for (let x = 0; x < cols; x++) {

        if (grid[y][x] === 2) return { x: x, y: y };

      }

    }

    return { x: cols - 2, y: rows - 2 };

  }

  function isTrack(x, y) {

    return grid[y] && (grid[y][x] === 0 || grid[y][x] === 2);

  }



  /* ------------------ Paint trail (permanent) ------------------ */

  const painted = new Set();

  const paintPops = [];

  paintCell(start.x, start.y);



  function key(x, y) { return x + "," + y; }



  function paintCell(x, y) {

    const k = key(x, y);

    if (!painted.has(k)) painted.add(k);

    paintPops.push({ x: x, y: y, t0: performance.now() });

    if (paintPops.length > 70) paintPops.shift();

  }



  /* ------------------ Rolling dust trail (fades out) ------------------ */

  const dust = [];

  let lastDustTime = 0;



  function addDustBurst(px, py, vx, vy, speed) {

    const now = performance.now();

    if (now - lastDustTime < 18) return;

    lastDustTime = now;



    const count = 2 + Math.floor(Math.random() * 2);

    for (let i = 0; i < count; i++) {

      const life = 420 + Math.random() * 380;

      const rr = tile * (0.035 + Math.random() * 0.03);



      const back = 10 + Math.random() * 10;

      const sx = px - vx * back + (Math.random() - 0.5) * 10;

      const sy = py - vy * back + (Math.random() - 0.5) * 10;



      const side = (Math.random() - 0.5) * 0.45;

      const dvx = (vx * -0.15 + side * vy) * (0.35 + Math.random() * 0.6) * speed;

      const dvy = (vy * -0.15 - side * vx) * (0.35 + Math.random() * 0.6) * speed;



      dust.push({

        x: sx, y: sy,

        vx: dvx, vy: dvy,

        r: rr,

        t0: now,

        life: life,

        rot: Math.random() * Math.PI * 2,

        spin: (Math.random() - 0.5) * 0.18,

        alpha0: 0.22 + Math.random() * 0.18

      });

    }

    if (dust.length > 260) dust.splice(0, dust.length - 260);

  }



  function drawDust(now) {

    if (dust.length === 0) return;



    for (let i = dust.length - 1; i >= 0; i--) {

      const p = dust[i];

      const age = now - p.t0;

      const t = age / p.life;



      if (t >= 1) {

        dust.splice(i, 1);

        continue;

      }



      p.x += p.vx;

      p.y += p.vy;

      p.vx *= 0.985;

      p.vy *= 0.985;

      p.rot += p.spin;



      const fade = 1 - t;

      const a = p.alpha0 * fade;



      ctx.save();

      ctx.globalAlpha = a;

      ctx.translate(p.x, p.y);

      ctx.rotate(p.rot);

      ctx.translate(-p.x, -p.y);



      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.6);

      grad.addColorStop(0, "rgba(255,245,230,0.85)");

      grad.addColorStop(0.55, "rgba(214,168,120,0.55)");

      grad.addColorStop(1, "rgba(214,168,120,0)");



      ctx.fillStyle = grad;

      ctx.beginPath();

      ctx.ellipse(p.x, p.y, p.r * 2.2, p.r * 1.6, 0, 0, Math.PI * 2);

      ctx.fill();



      ctx.restore();

    }

    ctx.globalAlpha = 1;

  }



  /* ------------------ Smooth movement ------------------ */

  let moving = false;

  let moveQueue = [];



  let anim = {

    t0: 0,

    dur: 140,

    sx: start.x,

    sy: start.y,

    tx: start.x,

    ty: start.y

  };



  function requestMove(dx, dy) {

    if (moving) {

      moveQueue.push({ dx: dx, dy: dy });

      if (moveQueue.length > 3) moveQueue.shift();

      return;

    }



    const nx = playerCell.x + dx;

    const ny = playerCell.y + dy;

    if (!isTrack(nx, ny)) return;



    moving = true;



    anim.t0 = performance.now();

    anim.sx = playerCell.x;

    anim.sy = playerCell.y;

    anim.tx = nx;

    anim.ty = ny;



    playerCell.x = nx;

    playerCell.y = ny;



    paintCell(nx, ny);



    const ddx = anim.tx - anim.sx;

    const ddy = anim.ty - anim.sy;

    const len = Math.max(0.001, Math.sqrt(ddx*ddx + ddy*ddy));

    roll.axisX = ddx / len;

    roll.axisY = ddy / len;

  }



  function onMoveFinished() {

    moving = false;



    queueSaveProgress();



    if (playerCell.x === goal.x && playerCell.y === goal.y) {

      setTimeout(() => alert("LEVEL COMPLETE!"), 60);

    }



    if (moveQueue.length > 0) {

      const m = moveQueue.shift();

      requestMove(m.dx, m.dy);

    }

  }



  /* Desktop keys (testing only) */

  window.addEventListener("keydown", function(e){

    if (e.key === "ArrowUp") requestMove(0, -1);

    if (e.key === "ArrowDown") requestMove(0, 1);

    if (e.key === "ArrowLeft") requestMove(-1, 0);

    if (e.key === "ArrowRight") requestMove(1, 0);

  });



  /* Swipe controls */

  let touchStartX = 0;

  let touchStartY = 0;



  canvas.addEventListener("touchstart", function(e){

    const t = e.touches[0];

    touchStartX = t.clientX;

    touchStartY = t.clientY;

  }, { piv,enn"tf){n.c  ntttt aa.     ayab  th ax    -  uee * --fuesnvct.ngt(=  .dlR dtt.w *    s.=og      tT(d,,,0);  dei Mboo

rbh);  enzeeeC
----gee rnn,     /     PaTo, ,       
    rc,     y);x,,ar,     rr Pa}

Cee  

ill     c  t }*    l  0,t:a      ba*/ () cctte    (00  #d

     Reborrd  ob=       i     

t    i  ty""      fi,  .lpob   ii=  /     x  psdH kee#5      lii }x.}

unnwP    itte  
    e 
i""
    ,l*     
     ++       oo{
[x c
        onxle   *it  *          p 2rmaah.


   cwCrg0.     sh  =  S
        ouph  .fi  es
cow*pw        St2b       dC,  ox l          txyl31; + 22  r            ooksnsck      ,    ,
 3,,:Wood   *=   t.+oyy       cclole;
 M(  )ctColg,;
txw= .fe c00( h  e  teera h  p(b ddo0;

 r(w;e )Atx3W
(l  (h      g
      x.+  

x.+y) );    glll   0tttyff  in+    -          aw,,   cle5;

.l8xat) r,  * c c So;
 gac cc  05  rSrg);0,,,   ty  egc, f   }nnBansckl8;
 =/     t   .atthik; =
     raa cce, ,wsckol    raao "#
trn);x. =o5,,,.7    ob 00
x..  ()c } f(pt      .s      t
 ll)ob=  illl"#      n(   all
(

r    y   x     c)       )       (       n.ccc.c  stt =n)lha);;  rat     th   uac 1 r+  t   is 1  ttis1   on {cf,c   la,    o }tr;
 }) 
 =lovd );ck     rx -  cad  );ra    
          cnrocxf,2  p,  a(p  cceeer  tRe  
te g  alx,,fudaaai sinnxSS]  .s

      xx(ycoctteRnt1,,cy);g.St(

addCp( "0  rS1555.f= g  egc.M
(lgt   pp]=   .taiii1)       38  ceeer(. r    baa 01    ll"r555.b(  (ccccy,,,at;
ct
ha r,aa
sa  y)xgslt                  *     x.en(*     dd222.  dd,2to,,"ior"r;
glll   t(sy.5 M2)


t     t     r
     sp    00 *n(  araaalsx* 
    dpba,2
kto5 s "")lppkActtyl;
cta iy rr   ,  PIl(pcss0 in0stttnntipli ppeid
    .,55  dopgb);tCooo0     "6)) sdC(1555555  aa=   yl cbe;
y,,,    ()estt     

fi     all0  rorg255555)  Wiatbetxxpy8,I    tx()x.pawe,Phr        x bctou

tr-


x.);ar+  y,   1,PI);  lllegb0,,8   .fon cree- p35,   addp(g.o
(0b5  loo ""
h( cctx ;
ay0.r*8,,MP; l= f00   f
ta

 aa0  nP  rc

   ro=  =()lpt rlea      pdnoore lllrooww  t  nn-  sw ssd+   thgrss.P3;;

Anaaax.a  = t     *     t ass

rk;


  fugeePl{)       eeplrCll,larl); e   cc,: .cprre:};   
  ont(-m im;  =.mat   =1poam;

 a cn(a   c  en s     {.cxcyssm} 


 nobocrs(oe 
    cs M.noe*atP
 tn s  10 s1 04 sl:*} 

 /----e psp ------------------sadi fe ouPrrs
    nREER)ferCUU=     v rt  g
imnc      ein;

 t  KEess mad":" ,dy  see:REna    eleeld        xarCl   yplelly,    pnto:n.
    t:w (IStn
      )       }
  }a  
        sero"erfe     }    /-------- Mnn---------------
unorao

 cclr(0oaroa
    olewws[  raa

(ndno cmarr   0  =    ye ar


 iv      t   imy  y  .sc M0.sy))  urp. l/  
nnw)inn t /Fi esnF  cumeeemeadde,   erlacum"ddteek  t.eeeennr(();
l"astcklpee")isli>ai  nttphEvn(,errescd(addis>eoa;


   

rt  Caa

nd r(l  

