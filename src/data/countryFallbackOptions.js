import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

function flagEmojiFromCountryCode(countryCode) {
  const normalizedCode = String(countryCode || "").trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(normalizedCode)) return "";

  return Array.from(normalizedCode)
    .map((char) => String.fromCodePoint(char.charCodeAt(0) + 127397))
    .join("");
}

export const COUNTRY_FALLBACK_OPTIONS = Object.entries(
  countries.getNames("en", { select: "official" })
)
  .map(([code, name]) => ({
    name,
    code,
    flag: "",
    flagEmoji: flagEmojiFromCountryCode(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));
