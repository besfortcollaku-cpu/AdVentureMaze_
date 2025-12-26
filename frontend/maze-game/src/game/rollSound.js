// src/game/rollSound.js
// Rolling noise + wall thump (synth) using WebAudio.
// No external files needed.

let audioCtx = null;

// rolling
let rollSource = null;
let rollGain = null;
let rollFilter = null;

// helpers
function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // mobile browsers can start suspended until first gesture
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// ✅ call this once after first user gesture (pointerdown/tap)
export async function ensureAudioUnlocked() {
  try {
    const ctx = getCtx();

    // Some browsers need resume
    if (ctx.state !== "running") {
      await ctx.resume().catch(() => {});
    }

    // Some browsers need a silent "tick" to truly unlock.
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.start(0);
    src.stop(0);
  } catch {}
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function startRollSound(intensity = 1) {
  const ctx = getCtx();
  stopRollSound();

  // White noise buffer (1 second loop)
  const bufferSize = Math.floor(ctx.sampleRate * 1);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    // slightly softer noise, we will shape with filter
    data[i] = (Math.random() * 2 - 1) * 0.35;
  }

  rollSource = ctx.createBufferSource();
  rollSource.buffer = buffer;
  rollSource.loop = true;

  rollFilter = ctx.createBiquadFilter();
  rollFilter.type = "lowpass";

  rollGain = ctx.createGain();

  // initial params
  updateRollSound(intensity);

  rollSource.connect(rollFilter);
  rollFilter.connect(rollGain);
  rollGain.connect(ctx.destination);

  rollSource.start();
}

// Smoothly change pitch/brightness + volume based on intensity/speed
// intensity ~ 0..3 (you can pass any number; it will be clamped)
export function updateRollSound(intensity = 1) {
  if (!rollFilter || !rollGain) return;

  const ctx = getCtx();
  const s = clamp(intensity, 0, 3);

  // Frequency = "pitch/brightness"
  // Higher speed => brighter roll
  const freq = 240 + s * 260; // 240..1020
  const vol = 0.05 + s * 0.05; // 0.05..0.20

  rollFilter.frequency.setTargetAtTime(freq, ctx.currentTime, 0.03);
  rollGain.gain.setTargetAtTime(vol, ctx.currentTime, 0.03);
}

export function stopRollSound() {
  if (!rollSource) return;

  const ctx = getCtx();
  try {
    // fade out quickly (avoid click)
    if (rollGain) rollGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.02);
    setTimeout(() => {
      try {
        rollSource?.stop();
      } catch {}
      try {
        rollSource?.disconnect();
      } catch {}
      rollSource = null;
      rollGain = null;
      rollFilter = null;
    }, 50);
  } catch {
    // hard stop fallback
    try {
      rollSource.stop();
    } catch {}
    try {
      rollSource.disconnect();
    } catch {}
    rollSource = null;
    rollGain = null;
    rollFilter = null;
  }
}

// Wall hit thump (short bassy pulse + tiny click)
// (You said: disable sound when wall hit -> just don't call this anywhere)
export function playWallThump(strength = 1) {
  const ctx = getCtx();
  const s = clamp(strength, 0.2, 2);

  const now = ctx.currentTime;

  // bass osc
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(130, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.09);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.35 * s, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

  // small click (noise burst)
  const clickBufSize = Math.floor(ctx.sampleRate * 0.03);
  const clickBuf = ctx.createBuffer(1, clickBufSize, ctx.sampleRate);
  const d = clickBuf.getChannelData(0);
  for (let i = 0; i < clickBufSize; i++) d[i] = (Math.random() * 2 - 1) * 0.25;

  const click = ctx.createBufferSource();
  click.buffer = clickBuf;

  const clickFilter = ctx.createBiquadFilter();
  clickFilter.type = "highpass";
  clickFilter.frequency.value = 800;

  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(0.0001, now);
  clickGain.gain.exponentialRampToValueAtTime(0.20 * s, now + 0.005);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  click.connect(clickFilter);
  clickFilter.connect(clickGain);
  clickGain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.14);

  click.start(now);
  click.stop(now + 0.05);
}{