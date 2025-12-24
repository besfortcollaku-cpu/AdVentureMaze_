// src/levels/index.js
import { levelOne as level1 } from "./level242.js";
import { level2 } from "./level2.js";

// ✅ Order matters (Next Level uses this array)
export const levels = [level1, level2];