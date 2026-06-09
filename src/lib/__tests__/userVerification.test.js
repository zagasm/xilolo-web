import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isUserAccountVerified,
  mergeVerifiedContactUser,
} from "../userVerification.js";

test("treats verified_at fields as verified account state", () => {
  assert.equal(isUserAccountVerified({ email_verified_at: "2026-06-09T10:00:00Z" }), true);
  assert.equal(isUserAccountVerified({ phone_verified_at: "2026-06-09T10:00:00Z" }), true);
  assert.equal(isUserAccountVerified({ email_verified: true }), true);
  assert.equal(isUserAccountVerified({ phone_verified: true }), true);
  assert.equal(isUserAccountVerified({ email_verified: false, phone_verified: false }), false);
});

test("marks signup email verification in the local user payload immediately", () => {
  const user = mergeVerifiedContactUser(
    { id: 1, email: "user@example.test", firstName: "Test" },
    { firstName: "Updated" },
    "email",
    "2026-06-09T10:00:00Z"
  );

  assert.deepEqual(user, {
    id: 1,
    email: "user@example.test",
    firstName: "Updated",
    email_verified: true,
    email_verified_at: "2026-06-09T10:00:00Z",
  });
});

test("marks phone verification without overwriting existing verified timestamp", () => {
  const user = mergeVerifiedContactUser(
    { id: 1, phone: "+2348030000000", phone_verified_at: "2026-06-01T10:00:00Z" },
    null,
    "phone",
    "2026-06-09T10:00:00Z"
  );

  assert.equal(user.phone_verified, true);
  assert.equal(user.phone_verified_at, "2026-06-01T10:00:00Z");
});
