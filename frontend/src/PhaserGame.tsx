// src/PhaserGame.tsx
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import Phaser from "phaser";
import MazeScene from "./game/MazeScene"; // adjust path if your MazeScene is elsewhere

export type IRefPhaserGame = {
  game: Phaser.Game | null;
  scene: Phaser.Scene | null;
};

type Props = {
  currentActiveScene?: (scene: Phaser.Scene) => void;
};

const PhaserGame = forwardRef<IRefPhaserGame, Props>(({ currentActiveScene }, ref) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<Phaser.Scene | null>(null);

  useImperativeHandle(ref, () => ({
    game: gameRef.current,
    scene: sceneRef.current,
  }));

  useEffect(() => {
    if (gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: "phaser-container",
      width: 360,
      height: 640,
      backgroundColor: "#0b1020",
      scene: [MazeScene],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Grab active scene after boot
    game.events.on("ready", () => {
      const s = game.scene.getScene("MazeScene");
      sceneRef.current = s;
      currentActiveScene?.(s);
    });

    // fallback if "ready" doesn't fire in your Phaser version
    setTimeout(() => {
      const s = game.scene.getScene("MazeScene");
      if (s) {
        sceneRef.current = s;
        currentActiveScene?.(s);
      }
    }, 500);

    return () => {
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, [currentActiveScene]);

  return <div id="phaser-container" style={{ width: "100%", height: "100%" }} />;
});

PhaserGame.displayName = "PhaserGame";
export default PhaserGame;