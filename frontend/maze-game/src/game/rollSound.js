// src/game/rollSound.js
// Rolling crystal-like noise using WebAudio (mobile-safe)

let rollSource = null;
let rollGain = null;
let rollFilter = null;


/* -------------------------------------------------- */
/* Start rolling sound */
/* -------------------------------------------------- */
export function startRollSound(intensity = 1) {
  const ctx = getCtx();
    if (!ctx) return;

  // recreate nodes every time (IMPORTANT)
  stopRollSound();
    if (!ctx) return; // 🔒 audio not unlocked

  // noise buffer
  const size = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < size; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.35;
  }

  rollSource = ctx.createBufferSource();
  rollSource.buffer = buffer;
  rollSource.loop = true;

  rollFilter = ctx.createBiquadFilter();
  rollFilter.type = "lowpass";

  rollGain = ctx.createGain();
  rollGain.gain.value = 0.0001;

  rollSource.connect(rollFilter);
  rollFilter.connect(rollGain);
  rollGain.connect(ctx.destination);

  rollSource.start();

  updateRollSound(intensity);
  // fade in
  rollGain.gain.linearRampToValueAtTime(
    0.12,
    ctx.currentTime + 0.15
  );
}

/* -------------------------------------------------- */
/* Update rolling sound (speed → brightness) */
/* -------------------------------------------------- */
export function updateRollSound(intensity = 1) {
  if (!rollFilter || !rollGain) return;

  const ctx = getCtx();
       if (!ctx) return; // 🔒 audio not unlocked

  const s = Math.max(0, Math.min(3, intensity));

  const freq = 260 + s * 320; // brightness
  const vol = 0.06 + s * 0.06;

  rollFilter.frequency.setTargetAtTime(freq, ctx.currentTime, 0.05);
  rollGain.gain.setTargetAtTime(vol, ctx.currentTime, 0.05);
}

/* -------------------------------------------------- */
/* Stop rolling sound */
/* -------------------------------------------------- */
export function stopRollSound() {

  const ctx = getCtx();
    if (!ctx) return; // 🔒 audio not unlocked

  try {
    rollGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.03);
    setTimeout(() => {
      try { rollSource.stop(); } catch {}
      try { rollSource.disconnect(); } catch {}
      rollSource = null;
      rollGain = null;
      rollFilter = null;
    }, 80);
  } catch {
    try { rollSource.stop(); } catch {}
    rollSource = null;
    rollGain = null;
    rollFilter = null;
  }
}

/* -------------------------------------------------- */
/* Optional wall thump (NOT used right now) */
/* -------------------------------------------------- */
export function playWallThump(strength = 1) {
  const ctx = getCtx();
    if (!ctx) return; // 🔒 audio not unlocked
  const s = Math.max(0.2, Math.min(2, strength));
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.35 * s, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.16);
}