import assert from "node:assert/strict";
import test from "node:test";

import { hostedSearchProfileSchema } from "../../src/lib/hosted/profile-schema.ts";

const validProfile = {
  targetRoles: ["Senior Data Engineer", "Senior Data Engineer"],
  prioritySkills: ["Spark", "Python"],
  excludedRoles: [],
  locations: ["Remote", "New York"],
  remotePreference: "remote",
  compensationCurrency: "USD",
  compensationMinimum: 180000,
  compensationTarget: 220000,
  sponsorshipRequired: true,
  approvedI140: true,
  cadencePreference: "daily",
};

test("hosted profile accepts the intended search constraints and deduplicates lists", () => {
  const parsed = hostedSearchProfileSchema.parse(validProfile);
  assert.deepEqual(parsed.targetRoles, ["Senior Data Engineer"]);
  assert.equal(parsed.compensationMinimum, 180000);
  assert.equal(parsed.sponsorshipRequired, true);
});

test("hosted profile refuses a browser-supplied tenant identity", () => {
  const parsed = hostedSearchProfileSchema.safeParse({
    ...validProfile,
    ownerId: "user_someone_else",
  });
  assert.equal(parsed.success, false);
});

test("hosted profile refuses a target below the minimum", () => {
  const parsed = hostedSearchProfileSchema.safeParse({
    ...validProfile,
    compensationTarget: 170000,
  });
  assert.equal(parsed.success, false);
  assert.match(JSON.stringify(parsed.error?.issues), /at least the minimum/i);
});
