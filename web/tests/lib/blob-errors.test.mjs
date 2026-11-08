import assert from "node:assert/strict";
import test from "node:test";

import { describePrivateUploadError } from "../../src/lib/hosted/blob-errors.mjs";

test("Blob OIDC environment failures explain the safe local alternatives", () => {
  const result = describePrivateUploadError(
    new Error('Vercel Blob: OIDC is enabled for this project, but not for the "development" environment.'),
  );
  assert.equal(result.status, 503);
  assert.match(result.message, /Vercel Preview/);
  assert.match(result.message, /BLOB_READ_WRITE_TOKEN/);
  assert.match(result.message, /not uploaded/);
});

test("Blob upload errors never invent a success state", () => {
  const result = describePrivateUploadError(new Error("network failed"));
  assert.equal(result.status, 500);
  assert.equal(result.message, "network failed");
});
