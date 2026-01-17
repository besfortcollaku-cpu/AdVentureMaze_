// src/ui/uiLogin.js


let isLoggingIn = false;
let isDone = false; // 🔒 permanent lock after success
export function createLoginUI(root) {
  root.insertAdjacentHTML(
    "beforeend",
    `
    <div id="loginOverlay" class="overlay active">
      <div class="loginText">Tap to continue</div>
      <div class="login-spinner hidden" id="loginSpinner"></div>
    </div>
    `
  );

  const overlay = document.getElementById("loginOverlay");
  const textEl = overlay.querySelector(".loginText");
  const spinner = document.getElementById("loginSpinner");

  let loginHandler = null;
   

  function showSpinner() {
    spinner?.classList.remove("hidden");
  }

  function hideSpinner() {
    spinner?.classList.add("hidden");
    isLoggingIn = false; // allow retry
  }

  overlay.addEventListener("pointerdown", () => {
  if (isLoggingIn || isDone) return; // 🔒 HARD BLOCK
  isLoggingIn = true;
  loginHandler?.();
});
  return {
    show(text = "Tap to continue") {
      textEl.textContent = text;
      overlay.classList.add("active");
    },

    hide() {
  isDone = true; // 🔒 block all future taps
  overlay.style.pointerEvents = "none"; // 🔥 THIS is the key
  overlay.classList.remove("active");
}

    setText(text) {
      textEl.textContent = text;
    },

    showSpinner,
    hideSpinner,

    onLogin(fn) {
      loginHandler = fn;
    },
  };
}