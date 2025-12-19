import * as Phaser from "phaser";
import MazeScene from "./MazeScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 360,
    height: 640,
  },

  parent: "game-container",
  backgroundColor: "#028af8",
  scene: [MazeScene],
};

const StartGame = (parent: string) => {
  return new Phaser.Game({
    ...config,
    parent,
  });
};

export default StartGame;