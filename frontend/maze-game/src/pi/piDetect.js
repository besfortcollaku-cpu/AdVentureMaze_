// src/pi/piDetect.js

function hasDevOverride() {
  const params = new URLSearchParams(window.location.search);
  return params.get("dev") === "true";
}

function isPiBrowserUA() {
  const ua = navigator.userAgent || "";
  return /pibrowser|pi browser|pinetwork|pi network/i.test(ua);
}

// Wait a bit for Pi SDK injection (Pi Browser sometimes injects late)
async function waitForPiSDK(timeoutMs = 1200) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (window.Pi) return true;
    await new Promise((r) => setTimeout(r, 50));
  }
  return !!window.Pi;
}

export async function enforcePiEnvironment({ desktopBlockEl } = {}) {
  const dev = hasDevOverride();

  // dev mode always allowed
  if (dev) {
    if (desktopBlockEl) {
      desktopBlockEl.classList.remove("show");
      desktopBlockEl.style.display = "none";
    }
    return { ok: true, reason: "dev_override" };
  }

  // wait for SDK, then confirm UA / SDK presence
  await waitForPiSDK(1200);

  const ok = !!window.Pi || isPiBrowserUA();

  if (desktopBlockEl) {
    if (ok) {
      desktopBlockEl.classList.remove("show");
      desktopBlockEl.style.display = "none";
    } else {
      desktopBlockEl.classList.add("show");
      desktopBlockEl.style.display = "block";
    }
  }

  return { ok, reason: ok ? "ok" : "not_pi_browser" };
}