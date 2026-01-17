// src/main.js
import "./style.css";

import { enforcePiEnvironment } from "./pi/piDetect.js";
import { initPi } from "./pi/piInit.js";
import { ensurePiLogin } from "./pi/piClient.js";

import { createLoginUI } from "./ui/uiLogin.js";

const BACKEND = "https://adventuremaze.onrender.com";

let CURRENT_USER = null;
let CURRENT_ACCESS_TOKEN = null;

async function boot() {
  // 1️⃣ Enforce Pi environment (blocks desktop etc.)
  const env = await enforcePiEnvironment({
    desktopBlockEl: document.getElementById("desktopBlock"),
  });
  if (!env.ok) return;

  // 2️⃣ Init Pi SDK
  initPi();

  // 3️⃣ Create Login UI
  const root = document.querySelector("#app");
  const loginUI = createLoginUI(root);

  // 4️⃣ Show spinner + tap
  loginUI.show("Tap to continue");

  // 5️⃣ Handle tap → Pi login
  loginUI.onLoginTap(async () => {
    try {
      loginUI.show("Logging in…");

      const loginRes = await ensurePiLogin({
        BACKEND,
        onLogin: ({ user, accessToken }) => {
          CURRENT_USER = user;
          CURRENT_ACCESS_TOKEN = accessToken;
          console.log("✅ LOGGED IN:", user);
        },
      });

      if (!loginRes?.ok) {
        loginUI.show("Login failed. Tap to retry");
        return;
      }

      // ✅ SUCCESS (stop here for now)
      loginUI.show("Login success ✅");
      console.log("ACCESS TOKEN:", CURRENT_ACCESS_TOKEN);

    } catch (err) {
      console.error("Login error:", err);
      loginUI.show("Login error. Tap to retry");
    }
  });
}

boot();