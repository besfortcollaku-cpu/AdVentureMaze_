// src/game/movement.js

import { getSettings } from "../settings.js";
import { ensureAudioUnlocked } from "./rollSound.js";
import { startRollSound, updateRollSound, stopRollSound } from "./rollSound.js";
export function setGyroPreset(name) {
  if (name === "soft") {
    GYRO.deadZone = 0.35;
    GYRO.maxTilt = 22;
    GYRO.gain = 0.9;
    GYRO.smooth = 0.08;
  }

  if (name === "normal") {
    GYRO.deadZone = 0.25;
    GYRO.maxTilt = 18;
    GYRO.gain = 1.0;
    GYRO.smooth = 0.12;
  }

  if (name === "hardcore") {
    GYRO.deadZone = 0.15;
    GYRO.maxTilt = 14;
    GYRO.gain = 1.2;
    GYRO.smooth = 0.18;
  }
}
let gyroLock = false;
let gyroEnabled = false;
let lastInput = "none"; // "gyro" | "swipe"
let gyroCooldown = 0;
let audioUnlocked = false;

function tryGyroMove() {
  if (!gyroEnabled || moving || gyroLock) return;

  const ax = Math.abs(tiltDX);
  const ay = Math.abs(tiltDY);

  if (ax < GYRO.deadZone && ay < GYRO.deadZone) {
    gyroLock = false; // reset when flat
    return;
  }

  gyroLock = true;

  if (ax > ay) {
    startSlide(tiltDX > 0 ? 1 : -1, 0);
  } else {
    startSlide(0, tiltDY > 0 ? 1 : -1);
  }
}

export function createMovement({ state, onMoveFinished }) {
    
  let moving = false;
  let soundActive = false;

  let anim = {
    t0: 0,
    dur: 0,
    sx: 0,
    sy: 0,
    tx: 0,
    ty: 0,
    dist: 0,
    lastPaintCellX: 0,
    lastPaintCellY: 0,
  };
  function refreshInputMode() {
  const s = getSettings();
  gyroEnabled = s.gyro;
}
refreshInputMode();
  const GYRO = {
  deadZone: 0.25,   // 0–1  (higher = less sensitive)
  maxTilt: 18,      // degrees needed for full input
  gain: 1.0,        // overall strength
  smooth: 0.12      // 0–1 smoothing (lower = heavier)
};
let smoothX = 0;
let smoothY = 0;

function onTilt(e) {
  const rawX = e.gamma || 0; // left/right
  const rawY = e.beta || 0;  // forward/back

  // smooth (low-pass filter)
  smoothX += (rawX - smoothX) * GYRO.smooth;
  smoothY += (rawY - smoothY) * GYRO.smooth;

  // normalize to -1..1
  let nx = smoothX / GYRO.maxTilt;
  let ny = smoothY / GYRO.maxTilt;

  // clamp
  nx = Math.max(-1, Math.min(1, nx));
  ny = Math.max(-1, Math.min(1, ny));

  // apply gain
  nx *= GYRO.gain;
  ny *= GYRO.gain;

  // dead zone
  tiltDX = Math.abs(nx) < GYRO.deadZone ? 0 : nx;
  tiltDY = Math.abs(ny) < GYRO.deadZone ? 0 : ny;
}

  function vibrate(pattern) {
    const s = getSettings();
    if (!s.vibration) return;
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch {}
  }

  function findSlideTarget(dx, dy) {
    const sx = state.player.x;
    const sy = state.player.y;

    let x = sx;
    let y = sy;

    while (true) {
      const nx = x + dx;
      const ny = y + dy;
      if (!state.isWalkable(nx, ny)) break;
      x = nx;
      y = ny;
    }

    return { x, y };
  }

  function startMove(dx, dy) {
      if (!audioUnlocked) {
  ensureAudioUnlocked();
  audioUnlocked = true;
}
        if (gyroEnabled) return; 
    if (moving) return;
    if (!dx && !dy) return;

    const target = findSlideTarget(dx, dy);
    if (target.x === state.player.x && target.y === state.player.y) return;

    moving = true;

    anim.t0 = performance.now();
    anim.sx = state.player.x;
    anim.sy = state.player.y;
    anim.tx = target.x;
    anim.ty = target.y;

    const ddx = anim.tx - anim.sx;
    const ddy = anim.ty - anim.sy;
    anim.dist = Math.max(1, Math.abs(ddx) + Math.abs(ddy)); // Manhattan tiles

    // ✅ faster movement
    const perTile = 45; // ms per tile
    anim.dur = Math.max(70, anim.dist * perTile);

    anim.lastPaintCellX = anim.sx;
    anim.lastPaintCellY = anim.sy;

    // 🔊 start rolling sound (ONLY if enabled)
    const s = getSettings();

if (s.sound) {
  startRollSound(Math.min(3, 0.8 + anim.dist * 0.25));
  soundActive = true;
} else {
  soundActive = false;
}
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function update(now) {
    if (!moving) return;

    // ✅ if user turned sound OFF during rolling → stop immediately
    const s = getSettings();
    // 🔊 rolling sound update
if (s.sound && soundActive) {
  const speedFeel = 1.2 + anim.dist * 0.25 * (1 - clamped);
  updateRollSound(Math.min(3, speedFeel));
}

// 🔇 sound turned OFF while moving
if (!s.sound && soundActive) {
  stopRollSound();
  soundActive = false;
}
    const t = (now - anim.t0) / anim.dur;
    const clamped = Math.max(0, Math.min(1, t));
    const k = easeOutCubic(clamped);

    // current float position
    const fx = anim.sx + (anim.tx - anim.sx) * k;
    const fy = anim.sy + (anim.ty - anim.sy) * k;

    // update rolling sound pitch ONLY if enabled + active
    // 🔊 rolling sound (STRICT)
if (s.sound && soundActive) {
  const speedFeel = 1.2 + anim.dist * 0.25 * (1 - clamped);
  updateRollSound(Math.min(3, speedFeel));
}

    // Determine which cell we are "in" during slide
    const cx = Math.round(fx);
    const cy = Math.round(fy);

    // Paint every new cell we pass through
    if (cx !== anim.lastPaintCellX || cy !== anim.lastPaintCellY) {
      const stepX =
        cx === anim.lastPaintCellX ? 0 : cx > anim.lastPaintCellX ? 1 : -1;
      const stepY =
        cy === anim.lastPaintCellY ? 0 : cy > anim.lastPaintCellY ? 1 : -1;

      let x = anim.lastPaintCellX;
      let y = anim.lastPaintCellY;

      while (x !== cx || y !== cy) {
        if (x !== cx) x += stepX;
        else if (y !== cy) y += stepY;

        if (state.isWalkable(x, y)) state.paint(x, y);
      }

      anim.lastPaintCellX = cx;
      anim.lastPaintCellY = cy;
    }

    // End
    if (clamped >= 1) {
      state.player.x = anim.tx;
      state.player.y = anim.ty;
      state.playerHit = true;

      // ensure final tile painted
      if (state.isWalkable(state.player.x, state.player.y)) {
        state.paint(state.player.x, state.player.y);
      }

      moving = false;

      // stop rolling sound (always safe)
      stopRollSound();
      soundActive = false;

      // 📳 vibration only (NO wall-hit sound)
      vibrate([18]);

      onMoveFinished?.();
    }
  }

  function getAnimatedPlayer(now) {
    if (!moving) {
      return { x: state.player.x, y: state.player.y, moving: false, progress: 0 };
    }

    const t = (now - anim.t0) / anim.dur;
    const clamped = Math.max(0, Math.min(1, t));
    const k = easeOutCubic(clamped);

    const x = anim.sx + (anim.tx - anim.sx) * k;
    const y = anim.sy + (anim.ty - anim.sy) * k;

    return { x, y, moving: true, progress: clamped };
  }

  return {
    startMove,
    update,
    getAnimatedPlayer,
    isMoving() {
      return moving;
    },
  };
}