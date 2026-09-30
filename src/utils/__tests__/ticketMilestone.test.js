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

test("an exact count renders only when the caller asserts it may — { exact: true }", () => {
  const owner = { tickets_total: 1240 };
  const shown = ticketDisplay(owner, { exact: true });
  assert.equal(shown.kind, "number");
  assert.equal(shown.value, "1.2K");
  assert.equal(shown.label, "Tickets Sold");
  assert.equal(ticketSentence(owner, { exact: true }), "Tickets Sold (1.2K)");
});

test("FAIL CLOSED: the same payload without the assertion is banded, not printed", () => {
  // The whole point: a number reaching a public surface is banded from its own value, so
  // a future endpoint cannot leak an exact count merely by including one.
  const leaked = { tickets_total: 1240 };
  const shown = ticketDisplay(leaked);
  assert.equal(shown.kind, "label");
  assert.equal(shown.value, "1,000+");
  assert.match(ticketSentence(leaked), /tickets sold/i);
  assert.doesNotMatch(String(shown.value), /1240|1,240/);
  assert.doesNotMatch(ticketSentence(leaked), /1240|1,240/);

  // and every band boundary holds under the default too
  assert.equal(ticketDisplay({ tickets_total: 99 }).value, "Under 100");
  assert.equal(ticketDisplay({ tickets_total: 100 }).value, "Under 1,000");
  assert.equal(ticketDisplay({ tickets_total: 20_000 }).value, "20,000+");
});

test("a singular count reads 'Ticket Sold' when being shown exactly", () => {
  assert.equal(ticketDisplay({ tickets_total: 1 }, { exact: true }).label, "Ticket Sold");
  assert.equal(ticketSentence({ tickets_total: 1 }, { exact: true }), "Ticket Sold (1)");
});

test("a numeric string counts as a number, but is still banded without the assertion", () => {
  assert.equal(ticketDisplay({ tickets_total: "1240" }, { exact: true }).kind, "number");
  assert.equal(ticketDisplay({ tickets_total: "1240" }).kind, "label");
});

test("a missing value falls back to the floor band rather than 0 tickets", () => {
  assert.equal(ticketDisplay({}).value, "Under 100");
  assert.equal(ticketSentence({}), MILESTONE_FLOOR);
});
