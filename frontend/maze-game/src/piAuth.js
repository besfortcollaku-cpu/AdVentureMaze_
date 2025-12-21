// src/piAuth.js

// Pi Network auth helper (frontend)

// Works in Pi Browser. In normal browser it will show a helpful error.



function isPiBrowser() {

  return typeof window !== "undefined" && typeof window.Pi !== "undefined";

}



async function piAuthenticate() {

  if (!isPiBrowser()) {

    throw new Error("Pi SDK not found. Open this game inside Pi Browser.");

  }



  // Minimal scopes for username + basic auth

  const scopes = ["username"];

  const onIncompletePaymentFound = (payment) => {

    console.log("Incomplete payment found:", payment);

  };



  const auth = await window.Pi.authenticate(scopes, onIncompletePaymentFound);

  return auth; // { accessToken, user: { username, uid } }

}



/**

 * Calls Pi.authenticate() and (optionally) verifies token with your backend.

 * If backend verify fails (or endpoint missing), login still succeeds locally.

 *

 * @param {string} backendBase e.g. "https://adventuremaze.onrender.com"

 * @returns {Promise<{auth:any, verifiedUser:any|null}>}

 */

export async function piLoginAndVerify(backendBase) {

  const auth = await piAuthenticate();



  let verifiedUser = null;



  // Optional backend verification:

  // Backend endpoint you should implement later:

  // POST {backendBase}/api/pi/verify  Authorization: Bearer <accessToken>

  // returns { ok:true, user:{ username, uid } }

  if (backendBase) {

    const base = backendBase.replace(/\/+$/, ""); // trim trailing slashes

    try {

      const res = await fetch(`${base}/api/pi/verify`, {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

          Authorization: `Bearer ${auth.accessToken}`,

        },

        body: JSON.stringify({

          uid: auth?.user?.uid || null,

          username: auth?.user?.username || null,

        }),

      });



      if (res.ok) {

        const data = await res.json();

        verifiedUser = data?.user || null;

      } else {

        console.warn("Backend verify failed:", res.status);

      }

    } catch (e) {

      console.warn("Backend verify unreachable (ok for now):", e);

    }

  }



  return { auth, verifiedUser };

}