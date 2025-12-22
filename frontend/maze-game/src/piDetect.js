// src/piDetect.js

export function isPiBrowser() {

  // Pi Browser usually injects window.Pi + specific userAgent string

  const ua = navigator.userAgent || "";

  const hasPiObject = typeof window !== "undefined" && !!window.Pi;

  const looksLikePiUA = /PiBrowser|Pi Network/i.test(ua);

  return hasPiObject || looksLikePiUA;

}



export function requirePiBrowserOrMessage() {

  if (isPiBrowser()) return { ok: true };



  return {

    ok: false,

    message:

      "Please open this game inside Pi Browser to login and pay with Pi.",

  };

}