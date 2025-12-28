
import { api } from "./pi/piClient.js";
import { updateCoinsUI } from "./ui/ui.js";

let currentUser = null;

export async function loadMe() {
  const res = await api("/api/me");
  if (!res.ok) throw new Error(res.error || "me failed");
  currentUser = res.user;
  updateCoinsUI(currentUser.coins);
  return res;
}

export async function rewardLevelComplete(level) {
  const res = await api("/api/rewards/level-complete", {
    method: "POST",
    body: { level },
  });
  if (res.user?.coins !== undefined) {
    updateCoinsUI(res.user.coins);
  }
  return res;
}

export async function useSkip() {
  const res = await api("/api/skip", { method: "POST" });
  if (res.user?.coins !== undefined) {
    updateCoinsUI(res.user.coins);
  }
  return res;
}

export async function useHint() {
  const res = await api("/api/hint", { method: "POST" });
  if (res.user?.coins !== undefined) {
    updateCoinsUI(res.user.coins);
  }
  return res;
}

window.appRewards = {
  rewardLevelComplete,
  useSkip,
  useHint,
};
