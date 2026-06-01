const DEFAULT_DATE_OPTIONS = {
  month: "short",
  day: "2-digit",
  year: "numeric",
};

const DEFAULT_TIME_OPTIONS = {
  hour: "numeric",
  minute: "2-digit",
};

const STATUS_MAP = {
  upcoming: "upcoming",
  ready_to_go_live: "upcoming",
  live: "live",
  paused: "live",
  ended: "ended",
  expired: "ended",
};

function parseNumericAmount(value) {
  if (typeof value === "number") return value;
  if (!value) return NaN;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  if (!cleaned) return NaN;
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? NaN : parsed;
}

export function normalizeTicketStatus(status) {
  const normalized = (status ?? "").toString().toLowerCase().trim();
  return STATUS_MAP[normalized] || STATUS_MAP.upcoming;
}

export function formatTicketStatusLabel(status) {
  const normalized = normalizeTicketStatus(status);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function formatTicketDate(dateStr, options = DEFAULT_DATE_OPTIONS) {
  if (!dateStr) return "-";
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-US", options);
}

export function formatTicketTime(timeStr, locale = "en-US", options = DEFAULT_TIME_OPTIONS) {
  if (!timeStr) return "";
  const parsed = new Date(timeStr);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString(locale, options);
  }
  const [hour, minute] = timeStr.split(":");
  const fallback = new Date();
  fallback.setHours(Number(hour) || 0, Number(minute) || 0, 0, 0);
  if (Number.isNaN(fallback.getTime())) return "";
  return fallback.toLocaleTimeString(locale, options);
}

export function formatTicketPrice(value, currencyLabel = "") {
  const numeric = parseNumericAmount(value);
  if (Number.isFinite(numeric)) {
    const formattedAmount = numeric.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    if (!currencyLabel) return formattedAmount;
    const needsSpace = currencyLabel.length > 1;
    return needsSpace
      ? `${currencyLabel} ${formattedAmount}`
      : `${currencyLabel}${formattedAmount}`;
  }

  if (typeof value === "string" && value.trim()) return value;
  return "—";
}

export function formatPaymentMethodLabel(value) {
  if (!value) return "—";

  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
