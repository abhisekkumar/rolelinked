import assert from "node:assert/strict";
import test from "node:test";

import {
  addTargetRoles,
  buildResumeGuidance,
  ROLE_EXAMPLES,
} from "../../src/lib/hosted/onboarding-profile.mjs";

test("onboarding accepts arbitrary professions and several titles at once", () => {
  assert.deepEqual(
    addTargetRoles(new Set(["Product Manager"]), "Marketing Manager, Nurse Practitioner\nUX Researcher"),
    ["Product Manager", "Marketing Manager", "Nurse Practitioner", "UX Researcher"],
  );
});

test("onboarding deduplicates role titles without forcing a preset career", () => {
  assert.deepEqual(
    addTargetRoles(["Marketing Manager"], "marketing manager, Brand Director"),
    ["Marketing Manager", "Brand Director"],
  );
  assert.ok(ROLE_EXAMPLES.includes("Marketing Manager"));
  assert.equal(ROLE_EXAMPLES.includes("Senior Data Engineer"), false);
});

test("resume guidance follows the roles the user selected", () => {
  assert.deepEqual(buildResumeGuidance(["Brand Director"]), [[
    "Brand Director resume",
    "A truthful source tailored for Brand Director opportunities.",
  ]]);
  assert.match(buildResumeGuidance([])[0][0], /first base resume/i);
});
