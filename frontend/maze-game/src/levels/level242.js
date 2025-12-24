// src/levels/level242.js
// (Keeping filename for now so nothing breaks. We just export Level 1 from here.)

export const level1 = {
  id: 1,
  name: "LEVEL 1",

  // 1 = wall / pit
  // 0 = walkable tile
  // 2 = start tile
  // 3 = (optional) goal tile (not used later — we’ll do “paint all tiles”)
  grid: [
    [1,1,1,1,1,1,1,1,1,1],
    [1,2,0,0,0,0,0,0,0,1],
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