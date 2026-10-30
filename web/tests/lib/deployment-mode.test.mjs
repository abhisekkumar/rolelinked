import test from "node:test";
import assert from "node:assert/strict";

import {
  hostedRouteDecision,
  isHostedAppPath,
  isHostedDeployment,
  isMarketingPath,
  usesStandaloneShell,
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
  assert.deepEqual(hostedRouteDecision("/about"), { action: "allow" });
  assert.deepEqual(hostedRouteDecision("/legal"), { action: "allow" });
  assert.deepEqual(hostedRouteDecision("/icon.svg"), { action: "allow" });
});

test("marketing routes stay outside the private dashboard shell", () => {
  assert.equal(isMarketingPath("/welcome"), true);
  assert.equal(isMarketingPath("/about"), true);
  assert.equal(isMarketingPath("/legal"), true);
  assert.equal(isMarketingPath("/pipeline"), false);
});

test("hosted app routes use their own tenant-safe shell", () => {
  assert.equal(isHostedAppPath("/onboarding"), true);
  assert.equal(isHostedAppPath("/app"), true);
  assert.equal(isHostedAppPath("/app/today"), true);
  assert.equal(isHostedAppPath("/pipeline"), false);
  assert.equal(usesStandaloneShell("/welcome"), true);
  assert.equal(usesStandaloneShell("/app/today"), true);
  assert.equal(usesStandaloneShell("/pipeline"), false);
  assert.deepEqual(hostedRouteDecision("/onboarding"), { action: "allow" });
  assert.deepEqual(hostedRouteDecision("/app/today"), { action: "allow" });
});

test("dashboard and API routes remain closed during the landing preview", () => {
  assert.deepEqual(hostedRouteDecision("/pipeline"), { action: "block" });
  assert.deepEqual(hostedRouteDecision("/api/cv"), { action: "block" });
  assert.deepEqual(hostedRouteDecision("/config"), { action: "block" });
});
