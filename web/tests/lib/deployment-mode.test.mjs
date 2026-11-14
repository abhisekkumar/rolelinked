import test from "node:test";
import assert from "node:assert/strict";

import {
  hostedRouteDecision,
  isHostedApiPath,
  isHostedAppPath,
  isHostedAuthPath,
  isHostedProtectedPath,
  isHostedDeployment,
  isHostedPublicAssetPath,
  isHostedSignedWorkerPath,
  isMarketingPath,
  usesStandaloneShell,
} from "../../src/lib/deployment-mode.mjs";

test("hosted mode is explicit and case-insensitive", () => {
  const localEnvironment = {};
  assert.equal(isHostedDeployment("hosted", localEnvironment), true);
  assert.equal(isHostedDeployment(" HOSTED ", localEnvironment), true);
  assert.equal(isHostedDeployment("local", localEnvironment), false);
  assert.equal(isHostedDeployment(undefined, localEnvironment), false);
});

test("Vercel deployments fail closed into hosted mode when the explicit setting is missing", () => {
  assert.equal(isHostedDeployment(undefined, { VERCEL: "1" }), true);
  assert.equal(isHostedDeployment(undefined, { VERCEL_ENV: "preview" }), true);
  assert.equal(isHostedDeployment(undefined, { VERCEL_TARGET_ENV: "production" }), true);
  assert.equal(
    isHostedDeployment("local", { VERCEL: "1" }),
    true,
    "a public Vercel deployment must not expose the filesystem-backed local dashboard",
  );
  assert.equal(isHostedDeployment(undefined, { VERCEL: "0", VERCEL_ENV: "" }), false);
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

test("hosted auth and API namespaces are explicit", () => {
  assert.equal(isHostedAuthPath("/sign-in"), true);
  assert.equal(isHostedAuthPath("/sign-up/sso-callback"), true);
  assert.equal(isHostedAuthPath("/__clerk/v1/client"), true);
  assert.equal(isHostedApiPath("/api/hosted/workspace"), true);
  assert.equal(isHostedApiPath("/api/pipeline"), false);
  assert.equal(isHostedPublicAssetPath("/api/logo"), true);
  assert.equal(isHostedPublicAssetPath("/api/cv"), false);
  assert.equal(isHostedProtectedPath("/api/logo"), false);
  assert.equal(isHostedProtectedPath("/app/today"), true);
  assert.equal(isHostedProtectedPath("/onboarding"), true);
  assert.equal(isHostedProtectedPath("/api/hosted/workspace"), true);
  assert.equal(isHostedProtectedPath("/app/discover"), true);
  assert.equal(isHostedProtectedPath("/app/pipeline"), true);
  assert.equal(isHostedProtectedPath("/api/hosted/discovery/run"), true);
  assert.equal(isHostedSignedWorkerPath("/api/hosted/discovery/worker"), true);
  assert.equal(isHostedProtectedPath("/api/hosted/discovery/worker"), false);
  assert.equal(isHostedSignedWorkerPath("/api/hosted/discovery/run"), false);
  assert.equal(isHostedProtectedPath("/api/hosted/jobs/job-id/status"), true);
  assert.equal(isHostedProtectedPath("/welcome"), false);
  assert.deepEqual(hostedRouteDecision("/sign-in"), { action: "allow" });
  assert.deepEqual(hostedRouteDecision("/api/hosted/workspace"), { action: "allow" });
  assert.deepEqual(hostedRouteDecision("/api/logo"), { action: "allow" });
  assert.deepEqual(hostedRouteDecision("/app/discover"), { action: "allow" });
  assert.deepEqual(hostedRouteDecision("/app/pipeline"), { action: "allow" });
});

test("dashboard and API routes remain closed during the landing preview", () => {
  assert.deepEqual(hostedRouteDecision("/pipeline"), { action: "block" });
  assert.deepEqual(hostedRouteDecision("/api/cv"), { action: "block" });
  assert.deepEqual(hostedRouteDecision("/config"), { action: "block" });
});
