import test from "node:test";
import assert from "node:assert/strict";

import {
  getHostedServiceReadiness,
  isHostedAuthConfigured,
} from "../../src/lib/hosted/config.mjs";

test("hosted auth requires both Clerk keys", () => {
  assert.equal(isHostedAuthConfigured({}), false);
  assert.equal(isHostedAuthConfigured({ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_x" }), false);
  assert.equal(isHostedAuthConfigured({ CLERK_SECRET_KEY: "sk_test_x" }), false);
  assert.equal(isHostedAuthConfigured({ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_x", CLERK_SECRET_KEY: "sk_test_x" }), true);
});

test("readiness exposes booleans and never secret values", () => {
  const readiness = getHostedServiceReadiness({
    ROLELINKED_DEPLOYMENT_MODE: "hosted",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_private",
    CLERK_SECRET_KEY: "sk_test_private",
    DATABASE_URL: "postgresql://private",
    OBJECT_STORAGE_ENDPOINT: "https://storage.example",
    OBJECT_STORAGE_BUCKET: "private-bucket",
    OBJECT_STORAGE_ACCESS_KEY_ID: "private-id",
    OBJECT_STORAGE_SECRET_ACCESS_KEY: "private-secret",
    SCHEDULER_SIGNING_SECRET: "private-scheduler",
    LLM_GATEWAY_API_KEY: "private-model-key",
  });

  assert.deepEqual(readiness, {
    auth: true,
    database: true,
    objectStorage: true,
    scheduler: true,
    modelGateway: true,
    deployment: "hosted",
  });
  assert.equal(JSON.stringify(readiness).includes("private"), false);
});
