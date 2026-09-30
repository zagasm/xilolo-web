/**
 * Ticket-sales milestones — the web mirror of App\Support\TicketMilestone.
 *
 * WHY THIS IS NOT JUST FORMATTING
 * -------------------------------
 * Ticket counts are private-ish: an exact number lets anyone estimate what an
 * organiser earned. The backend is the privacy boundary — it sends an exact count
 * only to the profile owner and admins, and a milestone LABEL to everyone else — so
 * the web's job is to print what it was given, never to reconstruct a number.
 *
 * It used to do the opposite. `profileTicketsSold()` accepted only numbers, so a
 * label string failed Number() and fell through to a "last resort" that SUMMED
 * paymentCount across user.allEvents — printing an exact ticket count to precisely
 * the visitors the milestone system exists to hide it from.
 *
 * FRAMING (founder, 2026-09-30): a band is labelled by the milestone already CLEARED
 * ("1,000+ tickets sold"), not by the next one it has not reached. The only ceilings
 * left are the floor ("Under 100") and the 100–999 gap ("Under 1,000"). The ladder is
 * the founder's: 100 / 1K / 10K / 20K / 50K / 100K / 1M — note the deliberate jump
 * from 10K to 20K.
 *
 * Must stay in step with the PHP class; `ticketMilestone.test.js` pins the ladder.
 */

import { formatCount } from "./countFormat.js";

/** The band a brand-new organiser is in. */
export const MILESTONE_FLOOR = "Under 100 tickets sold";

/** [minimum tickets, label] — descending, so the first match wins. */
export const MILESTONE_LADDER = [
  [1_000_000, "1,000,000+ tickets sold"],
  [100_000, "100,000+ tickets sold"],
  [50_000, "50,000+ tickets sold"],
  [20_000, "20,000+ tickets sold"],
  [10_000, "10,000+ tickets sold"],
  [1_000, "1,000+ tickets sold"],
  [100, "Under 1,000 tickets sold"],
  [0, MILESTONE_FLOOR],
];

/**
 * The band an exact count falls in. Only needed when a number genuinely reaches the
 * browser (i.e. the viewer is the owner or an admin); for everyone else the API has
 * already chosen the label and we print that untouched.
 */
export function ticketMilestoneLabel(count) {
  const n = Number(count);
  if (!Number.isFinite(n)) return MILESTONE_FLOOR;
  const safe = Math.max(0, Math.trunc(n));
  for (const [threshold, label] of MILESTONE_LADDER) {
    if (safe >= threshold) return label;
  }
  return MILESTONE_FLOOR;
}

/** First candidate that is actually present (0 counts as present). */
function firstTicketValue(user) {
  const candidates = [
    user?.ticketsSold,
    user?.tickets_sold,
    user?.tickets_total,
    user?.ticketsTotal,
    user?.successfulPayments,
    user?.successful_payments,
  ];
  for (const c of candidates) {
    if (c === null || c === undefined || c === "") continue;
    if (typeof c === "string" && c.trim() === "") continue;
    return c;
  }
  return null;
}

/** A value is numeric only if it is a number or a digits/separator string — never
 *  "1,000+ tickets sold" (which Number() would turn into NaN and hide the label). */
function asCount(raw) {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!/^[\d.,\s]+$/.test(trimmed)) return null;
  const n = Number(trimmed.replace(/[,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * Ready-to-render ticket figures, split so a card can show the figure big and the
 * caption small: { value, label, kind }.
 *
 * FAIL CLOSED: an exact count is rendered ONLY when the caller asserts this viewer is
 * allowed to see it (`{ exact: true }` — the profile owner, or an admin). Without that
 * assertion a number is banded from its own value, so no future endpoint can leak an
 * exact figure merely by including one in its payload. The page has to opt IN to showing
 * a real count; nothing opts in by accident.
 */
export function ticketDisplay(user, { exact = false } = {}) {
  const raw = firstTicketValue(user);
  const count = asCount(raw);

  if (count !== null && exact) {
    return {
      kind: "number",
      value: formatCount(count),
      label: count === 1 ? "Ticket Sold" : "Tickets Sold",
    };
  }

  // Band it: from the number if one arrived, otherwise print the label the API sent, or
  // the floor band when there is nothing at all.
  const band =
    count !== null
      ? ticketMilestoneLabel(count)
      : typeof raw === "string" && raw.trim() !== ""
        ? raw.trim()
        : MILESTONE_FLOOR;

  // "Under 1,000 tickets sold" -> "Under 1,000" / "1,000+ tickets sold" -> "1,000+"
  const split = /^(.*?)\s*tickets?\s*sold\s*$/i.exec(band);

  return {
    kind: "label",
    value: split ? split[1].trim() : band,
    label: "Tickets Sold",
  };
}

/**
 * The full sentence form, for copy that reads as prose rather than a figure:
 * "1,000+ tickets sold". Same fail-closed rule as ticketDisplay — see above.
 */
export function ticketSentence(user, { exact = false } = {}) {
  const raw = firstTicketValue(user);
  const count = asCount(raw);

  if (count !== null && exact) {
    return `${count === 1 ? "Ticket Sold" : "Tickets Sold"} (${formatCount(count)})`;
  }

  if (count !== null) return ticketMilestoneLabel(count);

  return typeof raw === "string" && raw.trim() !== "" ? raw.trim() : MILESTONE_FLOOR;
}
