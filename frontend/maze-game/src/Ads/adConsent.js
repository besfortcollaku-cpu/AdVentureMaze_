const STORAGE_KEY = "maze_ad_consent_v1";

const EEA_UK_REGIONS = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IS", "IE", "IT", "LV", "LI", "LT", "LU", "MT", "NL", "NO", "PL",
  "PT", "RO", "SK", "SI", "ES", "SE", "GB", "UK"
]);

const DEFAULT_STATE = {
  status: "unknown",
  personalization: "unknown",
  regionHint: "unknown",
  updatedAt: null,
};

function loadStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function emitChange(nextState) {
  try {
    window.dispatchEvent(new CustomEvent("maze:ad-consent-changed", {
      detail: { ...nextState },
    }));
  } catch {}
}

function saveStoredState(nextState) {
  const normalized = { ...DEFAULT_STATE, ...nextState };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {}

  emitChange(normalized);
  return normalized;
}

function extractLocaleRegions() {
  const locales = Array.isArray(navigator.languages) && navigator.languages.length
    ? navigator.languages
    : [navigator.language];

  return locales
    .map((locale) => String(locale || "").split("-")[1] || "")
    .map((region) => region.toUpperCase())
    .filter(Boolean);
}

function inferRegionHint() {
  let timeZone = "unknown";

  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown";
  } catch {}

  const localeRegions = extractLocaleRegions();
  const likelyEeaOrUk =
    timeZone.startsWith("Europe/") ||
    localeRegions.some((region) => EEA_UK_REGIONS.has(region));

  return {
    likelyEeaOrUk,
    regionHint: timeZone !== "unknown"
      ? timeZone
      : (localeRegions[0] || "unknown"),
  };
}

export function getAdConsentState() {
  return loadStoredState();
}

export function ensureAdConsentStateInitialized() {
  const current = loadStoredState();
  if (current.status !== "unknown") return current;

  const inferred = inferRegionHint();
  if (inferred.likelyEeaOrUk) {
    return {
      ...current,
      regionHint: inferred.regionHint,
    };
  }

  return saveStoredState({
    status: "not_required",
    personalization: "personalized",
    regionHint: inferred.regionHint,
    updatedAt: new Date().toISOString(),
  });
}

export function setAdConsentChoice(choice) {
  const personalization = choice === "non_personalized"
    ? "non_personalized"
    : "personalized";

  const current = ensureAdConsentStateInitialized();
  return saveStoredState({
    ...current,
    status: personalization === "personalized" ? "granted" : "denied",
    personalization,
    updatedAt: new Date().toISOString(),
  });
}

export function getAdRequestPreferences() {
  const state = ensureAdConsentStateInitialized();
  const personalizedAllowed =
    state.status === "granted" ||
    state.status === "not_required" ||
    state.personalization === "personalized";

  return {
    consentStatus: state.status,
    personalization: state.personalization,
    personalizedAllowed,
    nonPersonalizedOnly: !personalizedAllowed,
    canRequestAds: state.status !== "unknown",
  };
}

export function getAdConsentSummary() {
  const state = ensureAdConsentStateInitialized();

  if (state.status === "granted") {
    return "Personalized ads allowed.";
  }
  if (state.status === "denied") {
    return "Non-personalized ads selected.";
  }
  if (state.status === "not_required") {
    return "Consent not required on this device.";
  }
  return "Choose your ads preference before loading ads.";
}
