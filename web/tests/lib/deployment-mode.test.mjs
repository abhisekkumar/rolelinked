import test from "node:test";
import assert from "node:assert/strict";
import {
  assertHostedEnvironment,
  deploymentMode,
  isHostedDeployment,
  missingHostedEnvironment,
} from "../../src/lib/deployment-mode.mjs";

test("deployment mode defaults to local", () => {
  assert.equal(deploymentMode({}), "local");
  assert.equal(isHostedDeployment({}), false);
});

test("hosted mode is normalized", () => {
  assert.equal(isHostedDeployment({ ROLELINKED_DEPLOYMENT_MODE: " Hosted " }), true);
});

test("local mode requires no Clerk secrets", () => {
  assert.deepEqual(missingHostedEnvironment({}), []);
  assert.doesNotThrow(() => assertHostedEnvironment({}));
});

test("hosted mode names missing keys without exposing values", () => {
  const env = {
    ROLELINKED_DEPLOYMENT_MODE: "hosted",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example",
  };
  assert.deepEqual(missingHostedEnvironment(env), ["CLERK_SECRET_KEY"]);
  assert.throws(
    () => assertHostedEnvironment(env),
    (error) => error.message.includes("CLERK_SECRET_KEY") && !error.message.includes("pk_test_example"),
  );
});

test("hosted mode accepts both required Clerk keys", () => {
  assert.doesNotThrow(() =>
    assertHostedEnvironment({
      ROLELINKED_DEPLOYMENT_MODE: "hosted",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example",
      CLERK_SECRET_KEY: "fixture-secret-value",
    }),
  );
});
