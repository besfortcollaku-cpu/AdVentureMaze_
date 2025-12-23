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



function hardBlockInputs() {

  const stop = (e) => {

    e.preventDefault();

    e.stopPropagation();

    e.stopImmediatePropagation?.();

    return false;

  };



  // Block pointer/touch/mouse

  const pointerEvents = [

    "pointerdown", "pointermove", "pointerup",

    "mousedown", "mousemove", "mouseup",

    "touchstart", "touchmove", "touchend",

    "click", "dblclick", "contextmenu",

    "wheel",

  ];



  // Capture phase so we stop events BEFORE app gets them

  pointerEvents.forEach((ev) =>

    window.addEventListener(ev, stop, { capture: true, passive: false })

  );



  // Block keyboard

  window.addEventListener("keydown", stop, true);

  window.addEventListener("keyup", stop, true);



  // Stop scrolling

  document.documentElement.style.overflow = "hidden";

  document.body.style.overflow = "hidden";

}



export function enforcePiEnvironment({ desktopBlockEl } = {}) {

  const dev = hasDevOverride();

  const pi = isPiBrowser();



  // Allow dev override for testing

  if (dev) return { ok: true, reason: "dev override" };

  if (pi) return { ok: true, reason: "Pi Browser" };



  // Not Pi Browser: show overlay + hard-block interactions

  if (desktopBlockEl) {

    desktopBlockEl.style.display = "flex";

  }

  hardBlockInputs();



  return { ok: false, reason: "not pi browser" };

}