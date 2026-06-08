export const DEFAULT_PROFILE_COUNTRY_CODE = "+234";

export const PROFILE_PHONE_COUNTRIES = [
  { country: "Nigeria", code: "NG", dialCode: "+234", flag: "🇳🇬" },
  { country: "United States", code: "US", dialCode: "+1", flag: "🇺🇸" },
  { country: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧" },
  { country: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦" },
  { country: "Ghana", code: "GH", dialCode: "+233", flag: "🇬🇭" },
  { country: "South Africa", code: "ZA", dialCode: "+27", flag: "🇿🇦" },
  { country: "Kenya", code: "KE", dialCode: "+254", flag: "🇰🇪" },
  { country: "Uganda", code: "UG", dialCode: "+256", flag: "🇺🇬" },
  { country: "Tanzania", code: "TZ", dialCode: "+255", flag: "🇹🇿" },
  { country: "Rwanda", code: "RW", dialCode: "+250", flag: "🇷🇼" },
  { country: "Egypt", code: "EG", dialCode: "+20", flag: "🇪🇬" },
  { country: "Morocco", code: "MA", dialCode: "+212", flag: "🇲🇦" },
  { country: "Cameroon", code: "CM", dialCode: "+237", flag: "🇨🇲" },
  { country: "Cote d'Ivoire", code: "CI", dialCode: "+225", flag: "🇨🇮" },
  { country: "Senegal", code: "SN", dialCode: "+221", flag: "🇸🇳" },
  { country: "Benin", code: "BJ", dialCode: "+229", flag: "🇧🇯" },
  { country: "Togo", code: "TG", dialCode: "+228", flag: "🇹🇬" },
  { country: "India", code: "IN", dialCode: "+91", flag: "🇮🇳" },
  { country: "China", code: "CN", dialCode: "+86", flag: "🇨🇳" },
  { country: "United Arab Emirates", code: "AE", dialCode: "+971", flag: "🇦🇪" },
  { country: "Saudi Arabia", code: "SA", dialCode: "+966", flag: "🇸🇦" },
  { country: "Turkey", code: "TR", dialCode: "+90", flag: "🇹🇷" },
  { country: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪" },
  { country: "France", code: "FR", dialCode: "+33", flag: "🇫🇷" },
  { country: "Italy", code: "IT", dialCode: "+39", flag: "🇮🇹" },
  { country: "Spain", code: "ES", dialCode: "+34", flag: "🇪🇸" },
  { country: "Netherlands", code: "NL", dialCode: "+31", flag: "🇳🇱" },
  { country: "Ireland", code: "IE", dialCode: "+353", flag: "🇮🇪" },
  { country: "Portugal", code: "PT", dialCode: "+351", flag: "🇵🇹" },
  { country: "Brazil", code: "BR", dialCode: "+55", flag: "🇧🇷" },
  { country: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺" },
];

const countryDialCodesByLength = [...PROFILE_PHONE_COUNTRIES].sort(
  (a, b) => b.dialCode.length - a.dialCode.length
);

export function normalizeDialCode(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!/^[1-9]\d{0,3}$/.test(digits)) return "";
  return `+${digits}`;
}

export function normalizeLocalPhoneNumber(value) {
  return String(value || "").replace(/\D/g, "");
}

export function normalizePhoneForSubmit(value) {
  return normalizeLocalPhoneNumber(value).replace(/^0+/, "");
}

export function findPhoneCountryByDialCode(dialCode) {
  const normalizedDialCode = normalizeDialCode(dialCode);
  return (
    PROFILE_PHONE_COUNTRIES.find(
      (country) => country.dialCode === normalizedDialCode
    ) || PROFILE_PHONE_COUNTRIES[0]
  );
}

export function parseProfilePhone(rawPhone, fallbackDialCode) {
  const fallback = normalizeDialCode(fallbackDialCode) || DEFAULT_PROFILE_COUNTRY_CODE;
  const raw = String(rawPhone || "").trim();
  const cleaned = raw.replace(/[^\d+]/g, "");
  const digits = cleaned.replace(/\D/g, "");

  if (!digits) {
    return { countryCode: fallback, number: "" };
  }

  const matchedCountry = cleaned.startsWith("+")
    ? countryDialCodesByLength.find((country) =>
        digits.startsWith(country.dialCode.replace(/\D/g, ""))
      )
    : null;

  if (matchedCountry) {
    const prefixDigits = matchedCountry.dialCode.replace(/\D/g, "");
    return {
      countryCode: matchedCountry.dialCode,
      number: digits.slice(prefixDigits.length),
    };
  }

  const fallbackDigits = fallback.replace(/\D/g, "");
  if (digits.startsWith(fallbackDigits) && digits.length > fallbackDigits.length + 6) {
    return {
      countryCode: fallback,
      number: digits.slice(fallbackDigits.length),
    };
  }

  return { countryCode: fallback, number: digits };
}

export function validateProfilePhone(phone, label, { required = false } = {}) {
  const countryCode = normalizeDialCode(phone?.countryCode);
  const localNumber = normalizePhoneForSubmit(phone?.number);

  if (!localNumber) {
    return required ? `${label} is required.` : "";
  }

  if (!countryCode) {
    return `Select a valid country code for ${label.toLowerCase()}.`;
  }

  if (localNumber.length < 10 || localNumber.length > 25) {
    return `${label} must be 10 to 25 digits after the country code.`;
  }

  return "";
}

