/**
 * Pins the founder's ticket-sales ladder (2026-09-30) and — more importantly — the
 * privacy property: a banded label must never let a viewer recover the exact count.
 *
 * The ladder here must match App\Support\TicketMilestone::BANDS in the backend.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  MILESTONE_FLOOR,
  ticketMilestoneLabel,
  ticketDisplay,
  ticketSentence,
} from "../ticketMilestone.js";

test("the ladder matches the backend bands, boundary by boundary", () => {
  const cases = [
    [0, "Under 100 tickets sold"],
    [1, "Under 100 tickets sold"],
    [99, "Under 100 tickets sold"],
    [100, "Under 1,000 tickets sold"],
    [999, "Under 1,000 tickets sold"],
    [1_000, "1,000+ tickets sold"],
    [9_999, "1,000+ tickets sold"],
    [10_000, "10,000+ tickets sold"],
    [19_999, "10,000+ tickets sold"],
    [20_000, "20,000+ tickets sold"],
    [49_999, "20,000+ tickets sold"],
    [50_000, "50,000+ tickets sold"],
    [99_999, "50,000+ tickets sold"],
    [100_000, "100,000+ tickets sold"],
    [999_999, "100,000+ tickets sold"],
    [1_000_000, "1,000,000+ tickets sold"],
    [5_000_000, "1,000,000+ tickets sold"],
  ];
  for (const [count, expected] of cases) {
    assert.equal(ticketMilestoneLabel(count), expected, `label for ${count}`);
  }
});

test("negative and non-numeric counts clamp to the floor band", () => {
  assert.equal(ticketMilestoneLabel(-5), MILESTONE_FLOOR);
  assert.equal(ticketMilestoneLabel("nonsense"), MILESTONE_FLOOR);
});

test("no band exposes the exact count", () => {
  assert.equal(ticketMilestoneLabel(101), ticketMilestoneLabel(998));
  assert.equal(ticketMilestoneLabel(1_001), ticketMilestoneLabel(9_998));
  assert.equal(ticketMilestoneLabel(20_001), ticketMilestoneLabel(49_998));
  for (const n of [0, 137, 4_321, 123_456, 2_000_000]) {
    assert.match(ticketMilestoneLabel(n), /[A-Za-z]/);
  }
});

test("a label the API sent is printed as given, never re-parsed into a number", () => {
  // This is the regression: a string used to fall through to summing allEvents.
  const publicViewer = {
    tickets_total: "1,000+ tickets sold",
    allEvents: [{ paymentCount: 1187 }, { paymentCount: 53 }],
  };
  const shown = ticketDisplay(publicViewer);
  assert.equal(shown.kind, "label");
  assert.equal(shown.value, "1,000+");
  assert.equal(shown.label, "Tickets Sold");

  const sentence = ticketSentence(publicViewer);
  assert.equal(sentence, "1,000+ tickets sold");
  assert.doesNotMatch(sentence, /1240|1,240|1187|53/);
});

test("the floor band is a label too, not '0'", () => {
  const shown = ticketDisplay({ tickets_total: "Under 100 tickets sold" });
  assert.equal(shown.kind, "label");
  assert.equal(shown.value, "Under 100");
});

test("an exact count still renders for the owner/admin, who are allowed it", () => {
  const owner = { tickets_total: 1240 };
  const shown = ticketDisplay(owner);
  assert.equal(shown.kind, "number");
  assert.equal(shown.value, "1.2K");
  assert.equal(shown.label, "Tickets Sold");
  assert.equal(ticketSentence(owner), "Tickets Sold (1.2K)");
});

test("a singular count reads 'Ticket Sold'", () => {
  assert.equal(ticketDisplay({ tickets_total: 1 }).label, "Ticket Sold");
  assert.equal(ticketSentence({ tickets_total: 1 }), "Ticket Sold (1)");
});

test("a numeric string is still a count (the API sometimes stringifies)", () => {
  assert.equal(ticketDisplay({ tickets_total: "1240" }).kind, "number");
});

test("a missing value falls back to the floor band rather than 0 tickets", () => {
  assert.equal(ticketDisplay({}).value, "Under 100");
  assert.equal(ticketSentence({}), MILESTONE_FLOOR);
});
