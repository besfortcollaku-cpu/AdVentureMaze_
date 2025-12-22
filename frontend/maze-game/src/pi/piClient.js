import { piLoginAndVerify } from "../piAuth.js";



export function setupPiLogin({

  BACKEND,

  loginBtn,

  loginBtnText,

  userPill,

  onLogin,

}) {

  let CURRENT_USER = { username: "guest", uid: null };

  let CURRENT_ACCESS_TOKEN = null;



  async function doPiLogin() {

    try {

      loginBtn.disabled = true;

      loginBtnText.textContent = "Logging in...";



      const { auth, verifiedUser } = await piLoginAndVerify(BACKEND);



      CURRENT_ACCESS_TOKEN = auth?.accessToken || null;



      const username =

        verifiedUser?.username ||

        auth?.user?.username ||

        "unknown";



      const uid =

        verifiedUser?.uid ||

        auth?.user?.uid ||

        null;



      CURRENT_USER = { username, uid };



      userPill.textContent = `User: ${CURRENT_USER.username}`;

      loginBtnText.textContent = "Logged in ✅";



      if (onLogin) onLogin({ user: CURRENT_USER, accessToken: CURRENT_ACCESS_TOKEN });

    } catch (e) {

      alert("Pi Login failed: " + (e?.message || String(e)));

      loginBtnText.textContent = "Login with Pi";

    } finally {

      loginBtn.disabled = false;

    }

  }



  if (loginBtn) loginBtn.addEventListener("click", doPiLogin);

}