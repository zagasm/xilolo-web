export const BANKS_CACHE_KEY = "Xilolo_banks_cache_v1";
export const BANKS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const COUNTRIES_API_URL =
  "https://restcountries.com/v3.1/all?fields=name,cca2,flags";
export const COUNTRY_GEOLOOKUP_API_URL = "https://api.country.is/";
export const DIDIT_RETRYABLE_STATUSES = ["Declined", "Abandoned", "Expired"];
export const BANK_STEPPER_STEPS = ["Account details", "Verify identity"];

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
  return {
    name: country?.name?.common || "",
    code: country?.cca2 || "",
    flag: country?.flags?.svg || country?.flags?.png || "",
    flagEmoji: country?.flags?.emoji || "",
  };
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
