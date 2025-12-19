// src/game/pi.ts
declare global {
  interface Window { Pi: any; }
}

export type PiAuth = {
  accessToken: string;
  user: { username: string; uid: string };
};

export async function piLogin(scopes: string[] = ["username", "payments"]) {
  const Pi = (window as any).Pi;
  if (!Pi) throw new Error("Pi SDK not loaded. Open in Pi Browser / Sandbox.");

  const auth = await Pi.authenticate(scopes, () => {});
  return auth as PiAuth;
}

// Rewarded ad (Pi Ad Network)
export async function showRewardedAd(): Promise<{ adId: string }> {
  if (!window.Pi?.Ads) throw new Error("Pi Ads not available (not approved yet)");
  const res = await window.Pi.Ads.showAd("rewarded");
  return { adId: res.adId };
}