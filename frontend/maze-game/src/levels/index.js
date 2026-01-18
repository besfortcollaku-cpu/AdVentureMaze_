// src/levels/index.js



import { level1 } from "./level1.js";
import { level2 } from "./level2.js";
import { level3 } from "./level3.js";
import { level4 } from "./level4.js";
import { level5 } from "./level5.js";
import { level6 } from "./level6.js";
import { level7 } from "./level7.js";
import { level8 } from "./level8.js";
import { level9 } from "./level9.js";

 const levels = [
  level1,
  level2,
  level3,
  level4,
  level5,
  level6,
  level7,
  level8,
  level9,
];

export function levels(num) {
  const fn = levels[num - 1];
  if (!fn) {
    console.error("❌ Level not found:", num);
    return;
  }

  console.log("🎮 Loading level", num);
  fn();
}