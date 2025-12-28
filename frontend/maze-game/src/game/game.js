
import { rewardLevelComplete } from "./main.js";

export function onLevelCompleted(levelNumber) {
  console.log("Level completed:", levelNumber);
  rewardLevelComplete(levelNumber).catch(console.error);
}

window.__testLevelComplete = onLevelCompleted;
