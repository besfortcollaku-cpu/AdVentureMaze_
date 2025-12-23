// src/pi/piDetect.js



export function isPiBrowser() {

  // Pi Browser typically injects window.Pi (Pi SDK)

  if (typeof window !== "undefined" && window.Pi) return true;



  const ua = (navigator.userAgent || "").toLowerCase();

  // Common UA hints people see in Pi Browser builds

  if (ua.includes("pibrowser")) return true;

  if (ua.includes("pi browser")) return true;



  return false;

}



export function isMobile() {

  const ua = (navigator.userAgent || "").toLowerCase();

  return /android|iphone|ipad|ipod|mobile/.test(ua);

}



export function hasDevOverride() {

  const params = new URLSearchParams(window.location.search);

  return params.get("dev") === "true";

}



/**

 * Shows a blocker overlay if NOT in Pi Browser.

 * - Allows desktop testing with ?dev=true

 * - Returns { ok, reason }

 */

export function enforcePiEnvironment({ desktopBlockEl } = {}) {

  if (hasDevOverride()) return { ok: true, reason: "dev-override" };



  const pi = isPiBrowser();

  const mobile = isMobile();



  // Pi requirement: must be inside Pi Browser (and usually mobile)

  const ok = pi && mobile;



  if (!ok && desktopBlockEl) {

    desktopBlockEl.style.display = "flex";

    desktopBlockEl.style.pointerEvents = "auto";

    desktopBlockEl.style.opacity = "1";

  }



  return {

    ok,

    reason: !pi ? "not-pi-browser" : "not-mobile",

  };

}