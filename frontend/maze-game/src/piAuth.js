// src/piAuth.js



/**

 * Pi Auth helper:

 * - requires Pi Browser (Pi SDK available)

 * - returns { auth, verifiedUser }

 *

 * Backend contract:

 * POST { accessToken } to `${BACKEND}/api/pi/verify`

 * => { user: { username, uid } }

 */



export function isPiBrowser() {

  // Most reliable: Pi SDK object exists

  if (typeof window !== "undefined" && window.Pi) return true;



  // Fallback: UA contains PiBrowser (not always)

  const ua = (navigator.userAgent || "").toLowerCase();

  if (ua.includes("pibrowser")) return true;



  return false;

}



export async function piLoginAndVerify(BACKEND) {

  if (!isPiBrowser()) {

    throw new Error("Pi Browser required (open this inside Pi Browser).");

  }



  if (!window.Pi) {

    throw new Error("Pi SDK not found. Make sure you are inside Pi Browser.");

  }



  // Init Pi SDK (safe to call multiple times)

  try {

    window.Pi.init({ version: "2.0" });

  } catch (e) {

    // ignore if already initialized

  }



  // Ask user to authenticate

  // Scopes depend on your app; "username" is the common one

  const auth = await window.Pi.authenticate(["username"], (payment) => {

    // incomplete payments callback (Pi may call it later)

    console.log("Incomplete payment found:", payment);

  });



  if (!auth?.accessToken) {

    throw new Error("Pi auth did not return accessToken.");

  }



  // Verify token with backend (important: NEVER trust token only in frontend)

  const res = await fetch(`${BACKEND.replace(/\/$/, "")}/api/pi/verify`, {

    method: "POST",

    headers: {

      "Content-Type": "application/json",

      Authorization: `Bearer ${auth.accessToken}`,

    },

    body: JSON.stringify({ accessToken: auth.accessToken }),

  });



  if (!res.ok) {

    const msg = await res.text().catch(() => "");

    throw new Error(`Backend verify failed (${res.status}): ${msg}`);

  }



  const data = await res.json();

  return { auth, verifiedUser: data?.user || null };

}