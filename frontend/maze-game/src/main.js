import './style.css'

let time = 0

const app = document.querySelector('#app')

setInterval(() => {
    time++
      app.innerHTML = `
            <h1>Adventure Maze</h1>
            <p>Game running for ${time} seconds</p>
          `
        }, 1000)
      `
})