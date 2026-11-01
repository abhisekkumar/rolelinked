import test from "node:test";
import assert from "node:assert/strict";

import {
  getHostedServiceReadiness,
  isHostedAuthConfigured,
  isHostedDatabaseConfigured,
  isHostedObjectStorageConfigured,
} from "../../src/lib/hosted/config.mjs";

test("hosted auth requires both Clerk keys", () => {
  assert.equal(isHostedAuthConfigured({}), false);
  assert.equal(isHostedAuthConfigured({ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_x" }), false);
  assert.equal(isHostedAuthConfigured({ CLERK_SECRET_KEY: "sk_test_x" }), false);
  assert.equal(isHostedAuthConfigured({ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_x", CLERK_SECRET_KEY: "sk_test_x" }), true);
});

test("database and private Blob readiness use their platform credentials", () => {
  assert.equal(isHostedDatabaseConfigured({}), false);
  assert.equal(isHostedDatabaseConfigured({ DATABASE_URL: "postgresql://private" }), true);
  assert.equal(isHostedObjectStorageConfigured({}), false);
  assert.equal(isHostedObjectStorageConfigured({ BLOB_READ_WRITE_TOKEN: "private-token" }), true);
  assert.equal(
    isHostedObjectStorageConfigured({ VERCEL_OIDC_TOKEN: "private-oidc", BLOB_STORE_ID: "private-store" }),
    true,
  );
  assert.equal(isHostedObjectStorageConfigured({ VERCEL_OIDC_TOKEN: "private-oidc" }), false);
});

test("readiness exposes booleans and never secret values", () => {
  const readiness = getHostedServiceReadiness({
    ROLELINKED_DEPLOYMENT_MODE: "hosted",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_private",
    CLERK_SECRET_KEY: "sk_test_private",
    DATABASE_URL: "postgresql://private",
    BLOB_READ_WRITE_TOKEN: "private-blob-token",
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
