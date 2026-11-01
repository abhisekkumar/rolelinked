import test from "node:test";
import assert from "node:assert/strict";

import {
  requireTenantId,
  safeObjectFilename,
  tenantObjectKey,
} from "../../src/lib/hosted/tenant-scope.mjs";

test("tenant ids must come from a Clerk-compatible authenticated identifier", () => {
  assert.equal(requireTenantId("user_2abcDEF-123"), "user_2abcDEF-123");
  assert.throws(() => requireTenantId(""), /authenticated tenant id/);
  assert.throws(() => requireTenantId("../../other-user"), /authenticated tenant id/);
  assert.throws(() => requireTenantId("user/other"), /authenticated tenant id/);
});

test("private object keys stay inside the authenticated tenant namespace", () => {
  assert.equal(
    tenantObjectKey("user_2abcDEF-123", "resumes", "Staff Resume (final).pdf"),
    "users/user_2abcDEF-123/resumes/Staff-Resume-final-.pdf",
  );
  assert.equal(safeObjectFilename("../../../secret.tex"), "..-..-..-secret.tex");
  assert.throws(
    () => tenantObjectKey("user_2abcDEF-123", "../documents", "resume.pdf"),
    /object category/,
  );
});
