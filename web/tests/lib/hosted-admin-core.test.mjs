import assert from "node:assert/strict";
import test from "node:test";

import { hasHostedAdminRole, parseHostedAdminUserIds } from "../../src/lib/hosted/admin-core.mjs";

test("admin allowlist accepts comma and whitespace separated Clerk ids", () => {
  assert.deepEqual([...parseHostedAdminUserIds("user_one, user_two\nuser_three")], ["user_one", "user_two", "user_three"]);
});

test("only an explicit admin metadata role is accepted", () => {
  assert.equal(hasHostedAdminRole({ role: "admin" }), true);
  assert.equal(hasHostedAdminRole({ role: "member" }), false);
  assert.equal(hasHostedAdminRole(null), false);
});
