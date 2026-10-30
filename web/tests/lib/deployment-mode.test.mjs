import test from "node:test";
import assert from "node:assert/strict";

import {
  hostedRouteDecision,
  isHostedDeployment,
} from "../../src/lib/deployment-mode.mjs";

test("hosted mode is explicit and case-insensitive", () => {
  assert.equal(isHostedDeployment("hosted"), true);
  assert.equal(isHostedDeployment(" HOSTED "), true);
  assert.equal(isHostedDeployment("local"), false);
  assert.equal(isHostedDeployment(undefined), false);
});

test("the hosted root renders the landing page", () => {
  assert.deepEqual(hostedRouteDecision("/"), {
    action: "redirect",
    pathname: "/welcome",
  });
  assert.deepEqual(hostedRouteDecision("/welcome"), { action: "allow" });
  assert.deepEqual(hostedRouteDecision("/icon.svg"), { action: "allow" });
});

test("dashboard and API routes remain closed during the landing preview", () => {
  assert.deepEqual(hostedRouteDecision("/pipeline"), { action: "block" });
  assert.deepEqual(hostedRouteDecision("/api/cv"), { action: "block" });
  assert.deepEqual(hostedRouteDecision("/config"), { action: "block" });
});
