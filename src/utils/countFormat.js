/**
 * The "under 1,000" count rule (founder, restated 2026-09-30): counts read as
 * exact numbers up to 999, then abbreviate to ONE decimal — 999 -> "999",
 * 1,240 -> "1.2K", 1,250,000 -> "1.3M" (toFixed(1) ROUNDS, so never "1.25M").
 *
 * This is the single implementation. It was previously copy-pasted into
 * `ProfileHeader.jsx` (`formatCount`), `Organizers/topOrganizers.utils.js`
 * (`compactNumber`) and `Organizers/ForMobile/OrganisersForYou.jsx` (`compact`),
 * and raw `tickets_total` / `numberOfFollowers` values were printed straight into
 * labels on a few surfaces because there was no shared home to import from.
 *
 * Deliberately NOT the same as locale formatting with thousands separators: on a
 * card the compact form is shorter and never reflows the layout.
 */
export function formatCount(value) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "0";

  if (n >= 1_000_000_000) return trim(n / 1_000_000_000, "B");
  if (n >= 1_000_000) return trim(n / 1_000_000, "M");
  if (n >= 1000) return trim(n / 1000, "K");
  return String(Math.trunc(n));
}

/** One decimal place, with a trailing ".0" dropped: 12.0 -> "12", 12.4 -> "12.4". */
function trim(quotient, suffix) {
  const v = quotient.toFixed(1);
  return `${v.endsWith(".0") ? v.slice(0, -2) : v}${suffix}`;
}

export default formatCount;
