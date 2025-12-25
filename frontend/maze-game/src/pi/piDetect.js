// src/pi/piDetect.js

function hasDevOverride() {
  const params = new URLSearchParams(window.location.search);
  return params.get("dev") === "true";
}

// Simple detection (you can improve later if Pi adds a reliable flag)
function isPiBrowser() {
  const ua = navigator.userAgent || "";
  // Pi Browser UA often contains "PiBrowser" or "Pi Network"
  return /pibrowser|pi browser|pinetwork|pi network/i.test(ua);
}

// Allow regular mobile browsers too (so you can test without Pi)
function isMobileBrowser() {
  const ua = navigator.userAgent || "";
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobi/i.test(
    ua
  );
}

// allow ?dev=true to bypass
export async function enforcePiEnvironment({ desktopBlockEl } = {}) {
  const dev = hasDevOverride();

  // ✅ OK if: dev OR Pi Browser OR any Mobile browser
  const ok = dev || isPiBrowser() || isMobileBrowser();

  if (desktopBlockEl) {
    if (ok) {
      desktopBlockEl.classList.remove("show");
      desktopBlockEl.style.display = "none";
    } else {
      desktopBlockEl.classList.add("show");
      desktopBlockEl.style.display = "block";
    }
  }

  return {
    ok,
    reason: ok ? "ok" : "desktop_blocked",
  };
}