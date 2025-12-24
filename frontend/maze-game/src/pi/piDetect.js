// src/pi/piDetect.js

function hasDevOverride() {
  const params = new URLSearchParams(window.location.search);
  return params.get("dev") === "true";
}

// Pi Browser detection (best-effort)
// NOTE: Some Pi versions load window.Pi late, so we also wait for injection.
function isPiBrowserUA() {
  const ua = navigator.userAgent || "";
  return /pibrowser|pi browser|pinetwork|pi network/i.test(ua);
}

function hasPiInjected() {
  return !!(window.Pi && window.Pi.authenticate);
}

// device helpers
function isTouchDevice() {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}
function isNarrow() {
  return window.matchMedia("(max-width: 700px)").matches;
}
function isDesktopLike() {
  return !isTouchDevice() && !isNarrow();
}

function showDesktopBlock(desktopBlockEl, show) {
  if (!desktopBlockEl) return;
  desktopBlockEl.style.display = show ? "flex" : "none";
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Enforce Pi environment:
 * - allow ?dev=true to bypass
 * - allow Pi Browser (UA OR injected Pi object)
 * - block desktop completely
 * - allow normal mobile browsers (for testing) ONLY if you want -> currently: NOT allowed unless dev=true
 *
 * If you want to allow mobile Chrome/Safari too, tell me and I'll flip one boolean.
 */
export async function enforcePiEnvironment({ desktopBlockEl } = {}) {
  // dev override
  if (hasDevOverride()) {
    showDesktopBlock(desktopBlockEl, false);
    return { ok: true, reason: "dev_override" };
  }

  // Always block desktop (even if UA spoofed)
  if (isDesktopLike()) {
    showDesktopBlock(desktopBlockEl, true);
    return { ok: false, reason: "desktop_blocked" };
  }

  // Wait for Pi injection (up to ~2 seconds)
  // Some Pi Browser builds load window.Pi a moment after JS starts.
  const maxWaitMs = 2000;
  const stepMs = 100;
  let waited = 0;

  while (waited < maxWaitMs) {
    if (hasPiInjected()) break;
    await sleep(stepMs);
    waited += stepMs;
  }

  const ok = hasPiInjected() || isPiBrowserUA();

  if (!ok) {
    // Not Pi Browser on mobile (blocked)
    showDesktopBlock(desktopBlockEl, false);
    return { ok: false, reason: "not_pi_browser" };
  }

  // Pi Browser ok
  showDesktopBlock(desktopBlockEl, false);
  return { ok: true, reason: "ok" };
}