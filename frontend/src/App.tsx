import React, { useRef } from "react";
import PhaserGame, { type IRefPhaserGame } from "./PhaserGame";

export default function App() {
  const phaserRef = useRef<IRefPhaserGame>(null);

  const currentScene = (scene: any) => {
    console.log("Active scene:", scene?.scene?.key);
  };

  return (
    <div id="app">
      <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
    </div>
  );
}