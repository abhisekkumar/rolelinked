import assert from "node:assert/strict";
import test from "node:test";

import { hostedPostAuthDestination } from "../../src/lib/hosted/post-auth-destination.mjs";

test("completed returning accounts open the workspace", () => {
  assert.equal(hostedPostAuthDestination({
    identityMode: "clerk",
    databaseConfigured: true,
    onboardingComplete: true,
  }), "/app/today");
});

test("new or incomplete accounts enter onboarding", () => {
  assert.equal(hostedPostAuthDestination({
    identityMode: "clerk",
    databaseConfigured: true,
    onboardingComplete: false,
  }), "/onboarding");
});

test("preview mode and profile outages do not trap users in unsaveable setup", () => {
  assert.equal(hostedPostAuthDestination({
    identityMode: "preview",
    databaseConfigured: false,
  }), "/app/today");
  assert.equal(hostedPostAuthDestination({
    identityMode: "clerk",
    databaseConfigured: true,
    profileAvailable: false,
  }), "/app/today");
});
