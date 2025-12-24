// src/levels/index.js
import { level242 as level1 } from "./level242.js";
import { level2 } from "./level2.js";

export const levels = [level1, level2];

export function getLevel(index) {
  return levels[index] || null;
}