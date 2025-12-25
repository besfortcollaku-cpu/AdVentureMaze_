// src/levels/level242.js

// ✅ This file is LEVEL 1 now (we keep filename to avoid more path changes)



export const level1 = {

  name: "LEVEL 1",

  zoom: 1.0, // ✅ per level zoom (1 = normal, <1 zoom out, >1 zoom in)

  start: { x: 1, y: 1 },



  // ✅ 0 = walkable, 1 = wall

  // (No goal tile anymore)

  grid: [

    [1,1,1,1,1,1,1,1,1,1],

    [1,0,0,0,0,0,0,0,0,1],

    [1,0,1,1,1,1,1,1,0,1],

    [1,0,1,1,1,1,1,1,0,1],

    [1,0,0,0,0,0,0,1,0,1],

    [1,1,1,1,1,1,0,1,0,1],

    [1,0,0,0,0,1,0,0,0,1],

    [1,0,1,1,0,1,1,1,0,1],

    [1,0,0,0,0,0,0,0,0,1],

    [1,1,1,1,1,1,1,1,1,1],

  ],

};