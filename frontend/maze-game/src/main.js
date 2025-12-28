import { mountUI } from "./ui/ui.js";
import { ensurePiLogin } from "./pi/piClient.js";

async function start() {
  await ensurePiLogin();
  mountUI();
}
start();
