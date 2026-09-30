import assert from "node:assert/strict";
import test from "node:test";

import { formatCount } from "../countFormat.js";

/*
 * The founder's rule, restated 2026-09-30: "under 1,000" reads as the exact
 * number, above that it abbreviates. Before this was centralised, `tickets_total`
 * and `numberOfFollowers` were printed raw on the profile hero and the Social
 * snapshot card, which is the "top organizers still shows ticket sold in numbers"
 * report.
 */

test("counts stay exact under 1,000", () => {
  assert.equal(formatCount(0), "0");
  assert.equal(formatCount(1), "1");
  assert.equal(formatCount(19), "19");
  assert.equal(formatCount(860), "860");
  assert.equal(formatCount(999), "999");
});

test("counts abbreviate from 1,000 up, to one decimal", () => {
  assert.equal(formatCount(1000), "1K");
  assert.equal(formatCount(1240), "1.2K");
  assert.equal(formatCount(12_400), "12.4K");
  assert.equal(formatCount(999_999), "1000K");
  assert.equal(formatCount(1_000_000), "1M");
  assert.equal(formatCount(1_240_000), "1.2M");
  assert.equal(formatCount(1_250_000), "1.3M");
  assert.equal(formatCount(2_000_000_000), "2B");
});

test("a trailing .0 is dropped so whole thousands read as 1K not 1.0K", () => {
  assert.equal(formatCount(2000), "2K");
  assert.equal(formatCount(3_000_000), "3M");
});

test("junk never renders NaN or undefined into a label", () => {
  assert.equal(formatCount(undefined), "0");
  assert.equal(formatCount(null), "0");
  assert.equal(formatCount(""), "0");
  assert.equal(formatCount("not a number"), "0");
  // a milestone LABEL from the API is not a count — callers pass it through, and
  // this function must not turn it into a broken number.
  assert.equal(formatCount("Under 1,000 tickets sold"), "0");
});

test("numeric strings from the API still format", () => {
  assert.equal(formatCount("1240"), "1.2K");
  assert.equal(formatCount(1240.7), "1.2K");
});
