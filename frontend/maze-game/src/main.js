// src/main.js



// IMPORTS 
import "./style.css";

import { enforcePiEnvironment } from "./pi/piDetect.js";
import { initPi } from "./pi/piInit.js";
import { ensurePiLogin } from "./pi/piClient.js";

import { createLoginUI } from "./ui/uiLogin.js";

import { mountWelcomeUI } from "./ui/uiWelcome.js";
import { mountLevelsUI } from "./ui/uiLevels";

// IMPORT ENDS


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
  loginUI.onLogin(async () => {
  // prevent double taps
  loginUI.setText("Logging in…");
  loginUI.showSpinner();

  try {
    const loginRes = await ensurePiLogin({
      BACKEND,
      onLogin: ({ user, accessToken }) => {
        CURRENT_USER = user;
        CURRENT_ACCESS_TOKEN = accessToken;
        console.log("✅ LOGGED IN:", user);
      },
    });

    // ❌ login failed
    if (!loginRes?.ok) {
      loginUI.onLogin(async () => {
  loginUI.setText("Logging in…");
  loginUI.showSpinner();

  try {
    const loginRes = await ensurePiLogin({
      BACKEND,
      onLogin: ({ user, accessToken }) => {
        CURRENT_USER = user;
        CURRENT_ACCESS_TOKEN = accessToken;
        console.log("✅ LOGGED IN:", user);
      },
    });

    // ❌ FAIL
    if (!loginRes?.ok) {
      loginUI.hideSpinner();
      loginUI.setText("Login failed. Tap to retry");
      return;
    }

    // ✅ SUCCESS
loginUI.onLogin(async () => {
  try {
    const loginRes = await ensurePiLogin({
      BACKEND,
      onLogin: ({ user, accessToken }) => {
        CURRENT_USER = user;
        CURRENT_ACCESS_TOKEN = accessToken;
        console.log("✅ LOGGED IN:", user);
      },
    });

    // ❌ FAIL → stop here
    if (!loginRes?.ok) {
      loginUI.hideSpinner();
      loginUI.setText("Login failed. Tap to retry");
      return;
    }

    // ✅ SUCCESS
    console.log("ACCESS TOKEN:", CURRENT_ACCESS_TOKEN);

    // hide spinner + overlay AFTER short delay
    setTimeout(() => {
      loginUI.hideSpinner();
      loginUI.hide(); // remove overlay completely

      const welcomeUI = mountWelcomeUI(root, CURRENT_USER);
      welcomeUI.show();

      welcomeUI.onStart(() => {
        // hide welcome first
        welcomeUI.hide();

        // then show levels
        mountLevelsUI(root, {
          unlockedLevels: CURRENT_USER.level || 1,
          completedLevels: CURRENT_USER.completedLevels || [],
          onSelectLevel: (level) => {
            console.log("Selected level:", level);
            // load level logic here
          },
        });
      });
    }, 600);

  } catch (err) {
    console.error("Login error:", err);
    loginUI.hideSpinner();
    loginUI.setText("Login error. Tap to retry");
  }
});

}

boot();