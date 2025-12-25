// src/levels/index.js

import { level1 } from "./level1.js";
import { level2 } from "./level2.js";
import { level3 } from "./level3.js";
import { level4 } from "./level4.js";

// ✅ Order matters: Next Level uses this array
export const levels = [level1, level2, level3, level4];