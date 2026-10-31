import assert from "node:assert/strict";
import { test } from "node:test";

import nextConfig from "../../next.config.mjs";

test("development asset origins remain limited to the numeric loopback host", () => {
  assert.deepEqual(nextConfig.allowedDevOrigins, ["127.0.0.1"]);
  assert.equal(nextConfig.allowedDevOrigins.some((host) => host === "*" || host === "0.0.0.0"), false);
});
