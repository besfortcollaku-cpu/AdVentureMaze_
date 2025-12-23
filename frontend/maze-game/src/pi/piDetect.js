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


export function isPiBrowser() {

  // Pi Browser usually exposes window.Pi and/or "PiBrowser" in UA

  const ua = navigator.userAgent || "";

  return Boolean(window.Pi) || /PiBrowser/i.test(ua);

}



// allow ?dev=true to bypass

export function enforcePiEnvironment({ desktopBlockEl } = {}) {

  const params = new URLSearchParams(window.location.search);

  const dev = params.get("dev") === "true";



  const ok = dev || isPiBrowser();



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

    reason: ok ? "ok" : "not_pi_browser",

  };

}