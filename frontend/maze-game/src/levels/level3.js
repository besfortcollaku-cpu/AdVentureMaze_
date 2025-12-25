// src/levels/level3.js

// ✅ This file is LEVEL 3 now (we keep filename to avoid more path changes)

export const level3 = {

  name: "Erini",

  zoom: 0.92, // slightly zoomed-out (bigger maze feel)

  start: { x: 1, y: 1 },



  // ✅ 0 = walkable, 1 = wall

  grid: [

    [1,1,1,1,1,1,1,1,1,1,1],

    [1,0,0,0,0,0,0,0,0,0,1],

    [1,0,0,0,0,0,0,0,0,0,1],

    [1,0,1,1,1,1,1,1,1,1,1],

    [1,0,0,0,0,0,0,1,1,1,1],

    [1,0,0,0,0,0,1,0,0,0,1],

    [1,0,0,0,0,0,0,0,0,0,1],

    [1,0,0,0,0,0,0,0,1,0,1],

    [1,0,0,0,0,0,1,1,1,0,1],

    [1,0,0,1,1,0,0,0,0,0,1],

    [1,1,1,1,1,1,1,1,1,1,1],

  ],

};