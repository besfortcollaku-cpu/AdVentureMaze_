import './style.css'

const app = document.querySelector('#app')

app.innerHTML = `
      <h1>Adventure Maze</h1>
      <canvas id="game" width="400" height="400" style="border:1px solid #333"></canvas>
      <p>Use Arrow Keys or WASD</p>
`

const canvas = document.getElementById('game')
const ctx = canvas.getContext('2d')

const keys = Object.create(null)

window.addEventListener('keydown', (e) => {
      keys[e.key.toLowerCase()] = true
  })

window.addEventListener('keyup', (e) => {
      keys[e.key.toLowerCase()] = false
  })

const player = { x: 20, y: 20, size: 16, speed: 2 }

function clamp(v, min, max) {
      return Math.max(min, Math.min(max, v))
  }

  function update() {
      let dx = 0
        let dy = 0

          if (keys['arrowleft'] || keys['a']) dx -= player.speed
              if (keys['arrowright'] || keys['d']) dx += player.speed
                  if (keys['arrowup'] || keys['w']) dy -= player.speed
                      if (keys['arrowdown'] || keys['s']) dy += player.speed

                          player.x = clamp(player.x + dx, 0, canvas.width - player.size)
                        player.y = clamp(player.y + dy, 0, canvas.height - player.size)
                    }

                    function draw() {
                          ctx.clearRect(0, 0, canvas.width, canvas.height)

                            ctx.fillStyle = '#f5f5f5'
                              ctx.fillRect(0, 0, canvas.width, canvas.height)

                                ctx.fillStyle = '#2c7be5'
                                  ctx.fillRect(player.x, player.y, player.size, player.size)
                              }

                              function loop() {
                                  update()
                                    draw()
                                      requestAnimationFrame(loop)
                                  }

                                  loop()
                             