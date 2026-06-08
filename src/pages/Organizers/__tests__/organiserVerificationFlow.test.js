import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const organiserDir = resolve(__dirname, "..");
const sourceRoot = resolve(organiserDir, "../..");

function readSource(relativePath) {
  return readFileSync(resolve(sourceRoot, relativePath), "utf8");
}

test("organiser verification status copy does not show review state after DIDIT submission", async () => {
  const { mapDiditStatusCopy } = await import("../organiserVerificationUtils.js");

  assert.match(mapDiditStatusCopy("In Review"), /organiser access is active/i);
  assert.doesNotMatch(mapDiditStatusCopy("In Review"), /review|pending|waiting/i);
  assert.match(mapDiditStatusCopy("Approved"), /organiser access is active/i);
});

test("BVN and DIDIT success paths open the organiser success modal", () => {
  const source = readSource("pages/Organizers/BecomeOrganizer.jsx");

  assert.match(source, /OrganiserVerificationSuccessDialog/);
  assert.match(source, /const showOrganiserSuccess = async \(\) =>/);
  assert.match(source, /kycStatus === "verified"[\s\S]*await showOrganiserSuccess\(\)/);
  assert.match(source, /refreshed\?\.local_kyc_status === "verified"[\s\S]*await showOrganiserSuccess\(\)/);
  assert.doesNotMatch(source, /We're reviewing your details|under review|verification under review/i);
});

test("organiser success modal uses canvas-confetti and offers event creation", () => {
  const source = readSource("pages/Organizers/components/OrganiserDialogs.jsx");

  assert.match(source, /import confetti from "canvas-confetti"/);
  assert.match(source, /confetti\(\{/);
  assert.match(source, /Verification successful/);
  assert.match(source, /Create an event/);
});

test("create-event gate sends unverified organisers back to instant setup copy", () => {
  const source = readSource("pages/event/CreateEvent/event_types.jsx");

  assert.match(source, /Complete organiser verification/);
  assert.match(source, /activated instantly after a successful\s+verification/);
  assert.match(source, /Complete setup/);
  assert.doesNotMatch(source, /under review|KYC in progress|compliance team is reviewing|once a decision/i);
});
