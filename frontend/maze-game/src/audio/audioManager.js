const MUSIC_KEY = "maze_music_enabled";
const SFX_KEY = "maze_sfx_enabled";
const ASSET_BASE = "/audio/";

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
  sfxVolume: 0.4,
  musicVolume: 0.18,
  sfxEnabled: readBool(SFX_KEY, true),
  musicEnabled: readBool(MUSIC_KEY, true),
  sounds: new Map(),
  lastPlayAt: new Map(),
  activeFilePlayers: new Map(),
  warned: new Set(),
  bgNodes: null,
  pendingMusicStart: false,
};

function warnOnce(key, message) {
  if (state.warned.has(key)) return;
  state.warned.add(key);
  try {
    console.warn(message);
  } catch {}
}

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
  if (!state.masterGain || !state.sfxGain || !state.musicGain || !state.ctx) return;

  const m = Math.max(0, Math.min(1, state.masterVolume));
  const sfx = state.sfxEnabled ? Math.max(0, Math.min(1, state.sfxVolume)) : 0;
  const music = state.musicEnabled ? Math.max(0, Math.min(1, state.musicVolume)) : 0;

  state.masterGain.gain.setValueAtTime(m, state.ctx.currentTime);
  state.sfxGain.gain.setValueAtTime(sfx, state.ctx.currentTime);
  state.musicGain.gain.setValueAtTime(music, state.ctx.currentTime);

  // Keep HTMLAudio-based music volumes in sync too.
  const bg = state.activeFilePlayers.get("bg_music");
  if (bg) {
    bg.volume = Math.max(0, Math.min(1, m * music * Number(state.sounds.get("bg_music")?.volume ?? 1)));
  }
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

function categoryVolume(def) {
  const perSound = Number(def.volume ?? 1);
  if (def.category === "music") {
    if (!state.musicEnabled) return 0;
    return Math.max(0, Math.min(1, state.masterVolume * state.musicVolume * perSound));
  }
  if (!state.sfxEnabled) return 0;
  return Math.max(0, Math.min(1, state.masterVolume * state.sfxVolume * perSound));
}

function playTone(def, opts = {}) {
  const ctx = ensureCtx();
  if (!ctx || !state.unlocked) return false;

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
    return true;
  } catch {
    return false;
  }
}

function playSequence(def, opts = {}) {
  const seq = Array.isArray(def.notes) ? def.notes : [];
  if (!seq.length) return false;

  const ctx = ensureCtx();
  if (!ctx || !state.unlocked) return false;

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

  return true;
}

function getOrCreateFilePlayer(name, def) {
  let entry = state.activeFilePlayers.get(name);
  if (entry) return entry;

  const audio = new Audio(def.src);
  audio.preload = "auto";
  audio.loop = !!def.loop;

  entry = { audio, missing: false };
  state.activeFilePlayers.set(name, entry);

  audio.addEventListener("error", () => {
    entry.missing = true;
    warnOnce(`missing:${name}`, `[audio] Missing file for key "${name}" at ${def.src}. Using fallback.`);
  });

  return entry;
}

function playFile(name, def, opts = {}) {
  if (!def.src) return false;

  const entry = getOrCreateFilePlayer(name, def);
  if (!entry || entry.missing) return false;

  const el = entry.audio;
  el.loop = opts.loop != null ? !!opts.loop : !!def.loop;
  el.volume = categoryVolume(def);

  try {
    if (!el.loop) el.currentTime = 0;
  } catch {}

  try {
    const p = el.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        warnOnce(`play-failed:${name}`, `[audio] Could not play "${name}" from ${def.src}. Using fallback.`);
        entry.missing = true;
      });
    }
    return true;
  } catch {
    warnOnce(`play-failed:${name}`, `[audio] Could not play "${name}" from ${def.src}. Using fallback.`);
    entry.missing = true;
    return false;
  }
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

  // File-first map. If a file is missing, fallback is used automatically.
  state.sounds.set("ui_click", {
    category: "sfx",
    type: "file",
    src: `${ASSET_BASE}ui_click.mp3`,
    volume: 0.3,
    cooldownMs: 70,
    fallback: { type: "tone", freq: 680, duration: 0.045, gain: 0.05 },
  });

  state.sounds.set("popup_open", {
    category: "sfx",
    type: "file",
    src: `${ASSET_BASE}popup_open.mp3`,
    volume: 0.3,
    cooldownMs: 80,
    fallback: { type: "tone", freq: 510, duration: 0.1, gain: 0.055, curve: "up" },
  });

  state.sounds.set("popup_close", {
    category: "sfx",
    type: "file",
    src: `${ASSET_BASE}popup_close.mp3`,
    volume: 0.3,
    cooldownMs: 80,
    fallback: { type: "tone", freq: 420, duration: 0.09, gain: 0.05, curve: "down" },
  });

  state.sounds.set("coins_gain", {
    category: "sfx",
    type: "file",
    src: `${ASSET_BASE}coins_gain.mp3`,
    volume: 0.3,
    cooldownMs: 180,
    fallback: {
      type: "sequence",
      notes: [
        { freq: 620, dur: 0.07 },
        { freq: 760, dur: 0.07 },
        { freq: 920, dur: 0.1 },
      ],
      gap: 0.02,
      gain: 0.05,
    },
  });


  state.sounds.set("back_btn", {
    category: "sfx",
    type: "file",
    src: `${ASSET_BASE}back_btn.mp3`,
    volume: 0.3,
    cooldownMs: 120,
    fallback: { type: "tone", freq: 560, duration: 0.08, gain: 0.05, curve: "down" },
  });

  state.sounds.set("bg_music", {
    category: "music",
    type: "file",
    src: `${ASSET_BASE}bg_music.mp3`,
    loop: true,
    volume: 0.16,
  });

  // Keep compatibility key for existing ball-slide behavior.
  state.sounds.set("ball_slide", { category: "sfx", type: "none" });
}

function playFallback(name, def, options = {}) {
  const fb = def?.fallback;
  if (!fb) return false;

  if (fb.type === "tone") return playTone(fb, options);
  if (fb.type === "sequence") return playSequence(fb, options);
  return false;
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
    const ok = playFile(name, def, options);
    if (!ok) playFallback(name, def, options);
    return;
  }

  if (def.type === "music") {
    startBgMusicNodes();
  }
}

export function stop(name) {
  if (name === "bg_music") {
    stopBackgroundMusic();
    return;
  }

  const entry = state.activeFilePlayers.get(name);
  if (!entry?.audio) return;
  try {
    entry.audio.pause();
    entry.audio.currentTime = 0;
  } catch {}
}

export function stopAll() {
  stopBackgroundMusic();
  for (const [, entry] of state.activeFilePlayers.entries()) {
    try {
      entry.audio.pause();
      entry.audio.currentTime = 0;
    } catch {}
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
  if (!def) return;

  if (def.type === "file") {
    const ok = playFile("bg_music", def, { loop: true });
    if (!ok) playFallback("bg_music", def, { loop: true });
    return;
  }

  startBgMusicNodes();
}

export function stopBackgroundMusic() {
  stopBgMusicNodes();

  const entry = state.activeFilePlayers.get("bg_music");
  if (entry?.audio) {
    try {
      entry.audio.pause();
      entry.audio.currentTime = 0;
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





