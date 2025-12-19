// src/game/swipe.js
export function makeSwipeDetector(target, onSwipe) {
  let startX = 0, startY = 0, active = false;

  const onDown = (pointer) => {
    active = true;
    startX = pointer.x;
    startY = pointer.y;
  };

  const onUp = (pointer) => {
    if (!active) return;
    active = false;

    const dx = pointer.x - startX;
    const dy = pointer.y - startY;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    // minimum swipe distance (pixels)
    const MIN = 25;
    if (absX < MIN && absY < MIN) return;

    if (absX > absY) {
      onSwipe(dx > 0 ? "RIGHT" : "LEFT");
    } else {
      onSwipe(dy > 0 ? "DOWN" : "UP");
    }
  };

  target.on("pointerdown", onDown);
  target.on("pointerup", onUp);

  return () => {
    target.off("pointerdown", onDown);
    target.off("pointerup", onUp);
  };
}