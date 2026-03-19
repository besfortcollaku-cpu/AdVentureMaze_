const MUSIC_KEY = "maze_music_enabled";
const SFX_KEY = "maze_sfx_enabled";

function readBool(key, fallback = true) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return raw !== "0" && raw !== "false" && raw !== "off";
  } catch {
    return fallback;
  }
}

function writeBool(key, value) {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {}
}

const state = {
  unlocked: false,
  ctx: null,
  masterGain: null,
  sfxGain: null,
  musicGain: null,
  masterVolume: 0.6,
  sfxVolume: 0.35,
  musicVolume: 0.18,
  sfxEnabled: readBool(SFX_KEY, true),
  musicEnabled: readBool(MUSIC_KEY, true),
  sounds: new Map(),
  lastPlayAt: new Map(),
  activeFilePlayers: new Map(),
  bgNodes: null,
  pendingMusicStart: false,
};

function ensureCtx() {
  if (!state.ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;

    state.ctx = new Ctx();
    state.masterGain = state.ctx.createGain();
    state.sfxGain = state.ctx.createGain();
    state.musicGain = state.ctx.createGain();

    state.sfxGain.connect(state.masterGain);
    state.musicGain.connect(state.masterGain);
    state.masterGain.connect(state.ctx.destination);

    applyVolumes();
  }
  return state.ctx;
}

function applyVolumes() {
  if (!state.masterGain || !state.sfxGain || !state.musicGain) return;
  const m = Math.max(0, Math.min(1, state.masterVolume));
  const sfx = state.sfxEnabled ? Math.max(0, Math.min(1, state.sfxVolume)) : 0;
  const music = state.musicEnabled ? Math.max(0, Math.min(1, state.musicVolume)) : 0;

  state.masterGain.gain.setValueAtTime(m, state.ctx.currentTime);
  state.sfxGain.gain.setValueAtTime(sfx, state.ctx.currentTime);
  state.musicGain.gain.setValueAtTime(music, state.ctx.currentTime);
}

function nowMs() {
  return Date.now();
}

function canPlay(name) {
  const def = state.sounds.get(name);
  if (!def) return false;
  if (def.category === "sfx" && !state.sfxEnabled) return false;
  if (def.category === "music" && !state.musicEnabled) return false;

  const cd = Number(def.cooldownMs || 0);
  if (cd > 0) {
    const last = Number(state.lastPlayAt.get(name) || 0);
    if (nowMs() - last < cd) return false;
  }

  state.lastPlayAt.set(name, nowMs());
  return true;
}

function playTone(def, opts = {}) {
  const ctx = ensureCtx();
  if (!ctx || !state.unlocked) return;

  const freq = Number(opts.freq ?? def.freq ?? 640);
  const duration = Number(opts.duration ?? def.duration ?? 0.08);
  const gainAmount = Number(opts.gain ?? def.gain ?? 0.08);
  const curve = String(opts.curve || def.curve || "down");

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = def.wave || "sine";
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  if (curve === "up") {
    gain.gain.linearRampToValueAtTime(gainAmount, ctx.currentTime + duration * 0.45);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  } else {
    gain.gain.linearRampToValueAtTime(gainAmount, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  }

  osc.connect(gain);
  gain.connect(state.sfxGain);

  try {
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  } catch {}
}

function playSequence(def, opts = {}) {
  const seq = Array.isArray(def.notes) ? def.notes : [];
  if (!seq.length) return;

  const ctx = ensureCtx();
  if (!ctx || !state.unlocked) return;

  let t = ctx.currentTime;
  const gap = Number(def.gap ?? 0.03);
  const baseGain = Number(opts.gain ?? def.gain ?? 0.065);

  for (const n of seq) {
    const note = typeof n === "number" ? { freq: n, dur: 0.08 } : n;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = note.wave || "sine";
    osc.frequency.setValueAtTime(Number(note.freq || 660), t);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(baseGain, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + Number(note.dur || 0.08));

    osc.connect(gain);
    gain.connect(state.sfxGain);

    try {
      osc.start(t);
      osc.stop(t + Number(note.dur || 0.08) + 0.02);
    } catch {}

    t += Number(note.dur || 0.08) + gap;
  }
}

function playFile(name, def, opts = {}) {
  if (!def.src) return;

  let el = state.activeFilePlayers.get(name);
  if (!el) {
    el = new Audio(def.src);
    el.preload = "auto";
    if (def.loop) el.loop = true;
    state.activeFilePlayers.set(name, el);
  }

  el.volume = Math.max(0, Math.min(1, Number(def.volume ?? 1) * state.masterVolume));
  if (opts.loop != null) el.loop = !!opts.loop;

  try {
    if (!el.loop) el.currentTime = 0;
  } catch {}

  const p = el.play();
  if (p && typeof p.catch === "function") p.catch(() => {});
}

function startBgMusicNodes() {
  const ctx = ensureCtx();
  if (!ctx || !state.unlocked || !state.musicEnabled) return;
  if (state.bgNodes) return;

  const oscA = ctx.createOscillator();
  const oscB = ctx.createOscillator();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  const toneGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  oscA.type = "sine";
  oscB.type = "triangle";
  oscA.frequency.setValueAtTime(196, ctx.currentTime);
  oscB.frequency.setValueAtTime(247, ctx.currentTime);

  lfo.type = "sine";
  lfo.frequency.setValueAtTime(0.08, ctx.currentTime);
  lfoGain.gain.setValueAtTime(12, ctx.currentTime);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(800, ctx.currentTime);
  filter.Q.setValueAtTime(0.0001, ctx.currentTime);

  toneGain.gain.setValueAtTime(0.0001, ctx.currentTime);
  toneGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1.4);

  lfo.connect(lfoGain);
  lfoGain.connect(oscA.frequency);

  oscA.connect(filter);
  oscB.connect(filter);
  filter.connect(toneGain);
  toneGain.connect(state.musicGain);

  try {
    oscA.start();
    oscB.start();
    lfo.start();
    state.bgNodes = { oscA, oscB, lfo, toneGain };
  } catch {
    state.bgNodes = null;
  }
}

function stopBgMusicNodes() {
  const nodes = state.bgNodes;
  if (!nodes || !state.ctx) return;

  try {
    nodes.toneGain.gain.setTargetAtTime(0.0001, state.ctx.currentTime, 0.12);
  } catch {}

  setTimeout(() => {
    try { nodes.oscA.stop(); } catch {}
    try { nodes.oscB.stop(); } catch {}
    try { nodes.lfo.stop(); } catch {}
    state.bgNodes = null;
  }, 260);
}

function registerDefaults() {
  if (state.sounds.size > 0) return;

  state.sounds.set("ui_click", { category: "sfx", type: "tone", freq: 680, duration: 0.045, gain: 0.05, cooldownMs: 70 });
  state.sounds.set("popup_open", { category: "sfx", type: "tone", freq: 510, duration: 0.1, gain: 0.06, curve: "up", cooldownMs: 80 });
  state.sounds.set("popup_close", { category: "sfx", type: "tone", freq: 420, duration: 0.09, gain: 0.05, curve: "down", cooldownMs: 80 });
  state.sounds.set("coins_gain", {
    category: "sfx",
    type: "sequence",
    notes: [
      { freq: 620, dur: 0.07 },
      { freq: 760, dur: 0.07 },
      { freq: 920, dur: 0.1 },
    ],
    gap: 0.02,
    gain: 0.05,
    cooldownMs: 180,
  });

  // Optional file entries; if files are missing, playback safely no-ops.
  state.sounds.set("bg_music", { category: "music", type: "music" });
  state.sounds.set("ball_slide", { category: "sfx", type: "none" });
}

export function unlockGlobalAudio() {
  registerDefaults();
  const ctx = ensureCtx();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  state.unlocked = true;
  applyVolumes();

  if (state.pendingMusicStart) {
    state.pendingMusicStart = false;
    startBackgroundMusic();
  }
}

export function play(name, options = {}) {
  registerDefaults();
  const def = state.sounds.get(name);
  if (!def) return;
  if (!canPlay(name)) return;

  if (def.type === "tone") {
    playTone(def, options);
    return;
  }

  if (def.type === "sequence") {
    playSequence(def, options);
    return;
  }

  if (def.type === "file") {
    playFile(name, def, options);
    return;
  }
}

export function stop(name) {
  if (name === "bg_music") {
    stopBackgroundMusic();
    return;
  }

  const el = state.activeFilePlayers.get(name);
  if (!el) return;
  try {
    el.pause();
    el.currentTime = 0;
  } catch {}
}

export function stopAll() {
  stopBackgroundMusic();
  for (const [name, el] of state.activeFilePlayers.entries()) {
    try {
      el.pause();
      el.currentTime = 0;
    } catch {}
    state.activeFilePlayers.delete(name);
  }
}

export function setMusicEnabled(enabled) {
  state.musicEnabled = !!enabled;
  writeBool(MUSIC_KEY, state.musicEnabled);
  if (!state.musicEnabled) {
    stopBackgroundMusic();
  }
  applyVolumes();
}

export function setSfxEnabled(enabled) {
  state.sfxEnabled = !!enabled;
  writeBool(SFX_KEY, state.sfxEnabled);
  applyVolumes();
}

export function setMasterVolume(volume) {
  state.masterVolume = Math.max(0, Math.min(1, Number(volume || 0)));
  applyVolumes();
}

export function startBackgroundMusic() {
  registerDefaults();
  if (!state.musicEnabled) return;
  if (!state.unlocked) {
    state.pendingMusicStart = true;
    return;
  }

  const def = state.sounds.get("bg_music");
  if (def?.type === "file") {
    playFile("bg_music", { ...def, loop: true }, { loop: true });
    return;
  }

  startBgMusicNodes();
}

export function stopBackgroundMusic() {
  stopBgMusicNodes();

  const el = state.activeFilePlayers.get("bg_music");
  if (el) {
    try {
      el.pause();
      el.currentTime = 0;
    } catch {}
  }
}

export function isMusicEnabled() {
  return !!state.musicEnabled;
}

export function isSfxEnabled() {
  return !!state.sfxEnabled;
}

registerDefaults();