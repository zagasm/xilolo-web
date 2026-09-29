/**
 * Helpers mirrored 1:1 from the app's Top Organizers screen.
 *
 * APP SOURCE OF TRUTH (read-only): C:\Users\ceo\Desktop\xilolo-app
 *   lib/features/presentation/screens/profile/screens/top_organizers_screen.dart
 *     :63-77     rank sort — rank ascending, nulls LAST, stable by index
 *     :79-83     top1 / top2 / top3 / rest = sublist(3)
 *     :358-360   display name = _capitalizeUsername(userName)  (NOT `organiser`)
 *     :359       followers   = _compactNumber(numberOfFollowers)
 *     :827-839   _compactNumber   B / M / K, 1 decimal, strip trailing ".0"
 *     :818-825   _capitalizeUsername   null/''/'---' -> '---', else capitalise 1st
 *     :841-850   _initialsFromName     '?' when empty, else 1-2 letters
 *     :812-816   _gradientIndex        sum of code units % 6
 *     :576-583   the six avatar gradients
 *     :585       the gold ring for rank 1
 *
 * Kept in their own module on purpose: component/Organizers/organiser.utils.js
 * is imported by six other surfaces (Navbar, AccountCenter, AccountLeft,
 * BecomeOrganizer, OrganisersIFollow, OrgaaniserFollowers) and must not change.
 */

/** :576-583 — the six fallback gradients, in order. */
export const AVATAR_GRADIENTS = [
  ["#3A2E6E", "#7B5EC8"],
  ["#C8246C", "#FF6A3D"],
  ["#0B7A8C", "#16E0A3"],
  ["#5145C8", "#6D9BFF"],
  ["#8A2B0B", "#FFB23C"],
  ["#1A1140", "#5C3AC8"],
];

/** :585 — the rank-1 ring. */
export const GOLD_RING = ["#FFD23C", "#FF7A1A"];

/** :812-816 — the app folds UNICODE CODE UNITS (not code points) mod 6. */
export function gradientIndex(name) {
  const s = String(name ?? "").trim();
  if (!s) return 0;
  let sum = 0;
  for (let i = 0; i < s.length; i += 1) sum += s.charCodeAt(i);
  return sum % AVATAR_GRADIENTS.length;
}

/** :818-825 — top organisers print the USERNAME, never `organiser`. */
export function capitalizeUsername(username) {
  if (username === null || username === undefined) return "---";
  const trimmed = String(username).trim();
  if (!trimmed || trimmed === "---") return "---";
  return trimmed[0].toUpperCase() + trimmed.slice(1);
}

/** :827-839 — 12_400 -> "12.4K", 1_250_000 -> "1.25M" (1 dp), 0 -> "0". */
export function compactNumber(value) {
  const n = Number(value);
  const v = Number.isFinite(n) ? n : 0;
  if (v >= 1_000_000_000)
    return `${(v / 1_000_000_000).toFixed(1).replace(".0", "")}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace(".0", "")}K`;
  return String(Math.trunc(v));
}

/** :841-850 — 'Ada Obi' -> 'AO', 'Ada' -> 'A', '' -> '?' (the app's default). */
export function appInitials(name) {
  const raw = String(name ?? "").trim();
  if (!raw) return "?";
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0].toUpperCase();
  const second = parts.length > 1 ? parts[1][0].toUpperCase() : "";
  return `${first}${second}`;
}

/**
 * :360 / :479 — `data.hasActiveSubscription ?? false`. NOTE: unlike the home
 * rail's badge rule (suggested_organisers_section.dart:548-550, which also
 * accepts a `plan`), this screen keys the tick ONLY off the subscription flag.
 */
export function hasActiveSubscription(org) {
  const raw = org?.has_active_subscription ?? org?.hasActiveSubscription;
  return raw === true || raw === 1 || raw === "1";
}

/** :63-77 — rank ascending, nulls last, ties broken by payload order. */
export function sortByRank(list) {
  return list
    .map((value, index) => ({ value, index }))
    .sort((a, b) => {
      const aRank = Number(a.value?.rank);
      const bRank = Number(b.value?.rank);
      const aNull = !Number.isFinite(aRank);
      const bNull = !Number.isFinite(bRank);
      if (aNull && bNull) return a.index - b.index;
      if (aNull) return 1;
      if (bNull) return -1;
      if (aRank !== bRank) return aRank - bRank;
      return a.index - b.index;
    })
    .map((entry) => entry.value);
}

/** :477 — the row's rank cell is `(data.rank ?? 0).toInt()`. */
export function rankOf(org) {
  const n = Number(org?.rank);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

/** :614-619 / :611 — the app treats only a non-empty string as a usable URL. */
export function hasImage(url) {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  return trimmed !== "" && trimmed !== "null" && trimmed !== "undefined";
}
