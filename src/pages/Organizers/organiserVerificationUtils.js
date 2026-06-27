export const BANKS_CACHE_KEY = "Xilolo_banks_cache_v1";
export const BANKS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const COUNTRIES_API_URL = "/api/v1/country/code";
export const COUNTRY_GEOLOOKUP_API_URL = "https://api.country.is/";
export const COUNTRY_GEOLOOKUP_FALLBACK_API_URL = "https://ipapi.co/json/";
export const DIDIT_RETRYABLE_STATUSES = ["Declined", "Abandoned", "Expired"];
export const BANK_STEPPER_STEPS = ["Account details", "Verify identity"];

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

export function loadBanksFromCache() {
  try {
    const raw = localStorage.getItem(BANKS_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed.banks || !parsed.updatedAt) return null;
    if (Date.now() - parsed.updatedAt > BANKS_CACHE_TTL_MS) return null;

    return parsed.banks;
  } catch {
    return null;
  }
}

export function saveBanksToCache(banks) {
  try {
    localStorage.setItem(
      BANKS_CACHE_KEY,
      JSON.stringify({ banks, updatedAt: Date.now() })
    );
  } catch {
    // ignore cache write failures
  }
}

export function normalizeCountry(country) {
  const countryFlag = country?.flags?.svg || country?.flags?.png || country?.flag || "";
  const flagIsImage = isHttpUrl(countryFlag);

  return {
    name: country?.name?.common || country?.name || "",
    code: country?.cca2 || country?.iso_code || country?.code || "",
    flag: flagIsImage ? countryFlag : "",
    flagEmoji: country?.flags?.emoji || (flagIsImage ? "" : countryFlag),
  };
}

export function normalizeCountryCode(value) {
  const countryCode = String(value || "")
    .trim()
    .toUpperCase();

  return /^[A-Z]{2}$/.test(countryCode) ? countryCode : "";
}

export function extractCountryCodeFromGeoPayload(payload) {
  return normalizeCountryCode(
    payload?.country ||
      payload?.country_code ||
      payload?.countryCode ||
      payload?.country_code_iso2
  );
}

export function detectCountryCodeFromBrowserLocale() {
  const browserNavigator = globalThis?.navigator;
  const localeSources = [
    Intl.DateTimeFormat().resolvedOptions().locale,
    ...(Array.isArray(browserNavigator?.languages)
      ? browserNavigator.languages
      : []),
    browserNavigator?.language,
  ].filter(Boolean);

  for (const locale of localeSources) {
    try {
      const region = normalizeCountryCode(new Intl.Locale(locale).region);
      if (region) return region;
    } catch {
      const regionMatch = String(locale).match(/[-_]([A-Z]{2})(?:[-_]|$)/i);
      const region = normalizeCountryCode(regionMatch?.[1]);
      if (region) return region;
    }
  }

  return "";
}

export function mapDiditStatusCopy(status) {
  switch (status) {
    case "Not Started":
      return "Your verification session is ready. Start when you are ready to capture your ID and selfie.";
    case "In Progress":
      return "Your identity check has started. Finish the DIDIT steps to activate organiser access.";
    case "In Review":
      return "Verification submitted successfully. Your organiser access is active.";
    case "Approved":
      return "Your verification passed. Your organiser access is active.";
    case "Declined":
      return "Your verification was declined. Start a new session to retry with a clearer document capture.";
    case "Abandoned":
      return "You exited the verification before finishing. Start a new session when you are ready.";
    case "Expired":
      return "Your DIDIT session expired. Start a new session to continue.";
    default:
      return "Use DIDIT to verify your identity with a government-issued ID and selfie capture.";
  }
}
