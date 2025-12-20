import './style.css'

const app = document.querySelector('#app')

app.innerHTML = `
    <h1>Adventure Maze</h1>
    <canvas id="game" width="400" height="400"></canvas>
`

const canvas = document.getElementById('game')
const ctx = canvas.getContext('2d')

let player = { x: 20, y: 20, size: 20 }

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = '#f5f5f5'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

          ctx.fillStyle = '#2c7be5'
            ctx.fillRect(player.x, player.y, player.size, player.size)
          }

          draw()

