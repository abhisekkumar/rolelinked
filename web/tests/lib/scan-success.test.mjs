import assert from "node:assert/strict";
import test from "node:test";
import { scanSuccessLabel } from "../../src/lib/scan-success.mjs";

test("success rate is empty until a run exists", () => {
  assert.equal(scanSuccessLabel(0, 0), "—");
});

test("success rate rounds to a whole percentage", () => {
  assert.equal(scanSuccessLabel(4, 3), "75%");
  assert.equal(scanSuccessLabel(3, 1), "33%");
  assert.equal(scanSuccessLabel(2, 2), "100%");
});
