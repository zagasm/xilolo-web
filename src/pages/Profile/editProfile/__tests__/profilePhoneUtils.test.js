import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeDialCode,
  normalizePhoneForSubmit,
  parseProfilePhone,
  validateProfilePhone,
} from "../profilePhoneUtils.js";

test("normalizes country codes for the edit profile payload", () => {
  assert.equal(normalizeDialCode("+234"), "+234");
  assert.equal(normalizeDialCode("234"), "+234");
  assert.equal(normalizeDialCode("+080"), "");
  assert.equal(normalizeDialCode("0000"), "");
  assert.equal(normalizeDialCode("+12345"), "");
});

test("parses saved full phone numbers into country code and local phone state", () => {
  assert.deepEqual(parseProfilePhone("+2348035429908", "+234"), {
    countryCode: "+234",
    number: "8035429908",
  });
  assert.deepEqual(parseProfilePhone("2348035429908", "+234"), {
    countryCode: "+234",
    number: "8035429908",
  });
  assert.deepEqual(parseProfilePhone("08035429908", "+234"), {
    countryCode: "+234",
    number: "08035429908",
  });
});

test("cleans local phone number before profile submit", () => {
  assert.equal(normalizePhoneForSubmit("080-3542-9908"), "8035429908");
  assert.equal(normalizePhoneForSubmit("(803) 542 9908"), "8035429908");
});

test("validates profile phone values before hitting the API", () => {
  assert.equal(
    validateProfilePhone(
      { countryCode: "+234", number: "8035429908" },
      "Primary phone",
      { required: true }
    ),
    ""
  );
  assert.match(
    validateProfilePhone(
      { countryCode: "+080", number: "35429908" },
      "Primary phone",
      { required: true }
    ),
    /country code/i
  );
  assert.match(
    validateProfilePhone(
      { countryCode: "+234", number: "35429908" },
      "Primary phone",
      { required: true }
    ),
    /10 to 25 digits/i
  );
});

