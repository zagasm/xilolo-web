import {
  Banknote,
  Bitcoin,
  CreditCard,
  Globe2,
  Landmark,
  Wallet,
  Zap,
} from "lucide-react";

/**
 * Presentation for backend-described payment groups.
 *
 * The backend decides *what* the doors are (code, label, description, icon key, accent);
 * the web only decides how an icon key looks. An unknown key is not an error - it falls back
 * to a neutral wallet tile, so a new rail never renders a blank space.
 */
const ICONS = {
  bank: Landmark,
  landmark: Landmark,
  transfer: Banknote,
  cash: Banknote,
  globe: Globe2,
  world: Globe2,
  international: Globe2,
  bitcoin: Bitcoin,
  crypto: Bitcoin,
  card: CreditCard,
  wallet: Wallet,
  instant: Zap,
};

const ACCENTS = {
  primary: {
    tile: "tw:bg-accent-soft tw:text-accent-deep",
    chip: "tw:bg-accent-soft tw:text-accent-deep",
    selected: "tw:border-accent tw:bg-accent-soft",
    dot: "tw:bg-accent",
    text: "tw:text-accent-deep",
  },
  sky: {
    tile: "tw:bg-sky-50 tw:text-sky-700",
    chip: "tw:bg-sky-50 tw:text-sky-700",
    selected: "tw:border-sky-500 tw:bg-sky-50/70",
    dot: "tw:bg-sky-500",
    text: "tw:text-sky-700",
  },
  amber: {
    tile: "tw:bg-amber-50 tw:text-amber-700",
    chip: "tw:bg-amber-50 tw:text-amber-700",
    selected: "tw:border-amber-500 tw:bg-amber-50/70",
    dot: "tw:bg-amber-500",
    text: "tw:text-amber-700",
  },
  violet: {
    tile: "tw:bg-violet-50 tw:text-violet-700",
    chip: "tw:bg-violet-50 tw:text-violet-700",
    selected: "tw:border-violet-500 tw:bg-violet-50/70",
    dot: "tw:bg-violet-500",
    text: "tw:text-violet-700",
  },
};

export function getGroupIcon(iconKey) {
  return ICONS[String(iconKey || "").toLowerCase()] || Wallet;
}

export function getGroupAccent(accentKey) {
  return ACCENTS[String(accentKey || "").toLowerCase()] || ACCENTS.primary;
}

export function formatNaira(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "₦0";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: numeric % 1 === 0 ? 0 : 2,
  }).format(numeric);
}

export function formatForeign(value, currency) {
  const numeric = Number(value);
  const code = String(currency || "USD").toUpperCase();
  if (!Number.isFinite(numeric)) return `${code} 0.00`;

  // A dollar figure must read as dollars at a glance; Intl's "US$" prefix is noise here.
  if (code === "USD") return `$${numeric.toFixed(2)}`;
  if (code === "GBP") return `£${numeric.toFixed(2)}`;
  if (code === "EUR") return `€${numeric.toFixed(2)}`;

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numeric);
  } catch (_error) {
    return `${code} ${numeric.toFixed(2)}`;
  }
}
