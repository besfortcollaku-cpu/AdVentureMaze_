// src/game/rollSound.js

let audioCtx = null;
let source = null;
let gainNode = null;
let filter = null;

export function startRollSound(speed = 1) {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  stopRollSound();

  // Noise buffer
  const bufferSize = audioCtx.sampleRate * 1;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.4;
  }

  source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  // Low-pass filter (smooth rolling feel)
  filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 350 + speed * 120;

  // Volume
  gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.12;

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  source.start();
}

export function stopRollSound() {
  if (source) {
    try {
      source.stop();
    } catch {}
    source.disconnect();
    source = null;
  }
}