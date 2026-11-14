import assert from "node:assert/strict";
import test from "node:test";

import {
  HOSTED_DISCOVERY_QUEUED_TIMEOUT_MS,
  HOSTED_DISCOVERY_RUNNING_TIMEOUT_MS,
  hostedDiscoveryStaleCutoffs,
} from "../../src/lib/hosted/discovery-run-health.mjs";

test("hosted discovery uses a longer safety window for an active worker", () => {
  assert.ok(HOSTED_DISCOVERY_RUNNING_TIMEOUT_MS > HOSTED_DISCOVERY_QUEUED_TIMEOUT_MS);
});

test("hosted discovery stale cutoffs are deterministic and do not mutate the input", () => {
  const now = new Date("2026-11-14T12:00:00.000Z");
  const original = now.getTime();
  const cutoffs = hostedDiscoveryStaleCutoffs(now);

  assert.equal(cutoffs.queuedBefore.getTime(), original - HOSTED_DISCOVERY_QUEUED_TIMEOUT_MS);
  assert.equal(cutoffs.runningBefore.getTime(), original - HOSTED_DISCOVERY_RUNNING_TIMEOUT_MS);
  assert.equal(now.getTime(), original);
});

test("hosted discovery stale cutoffs reject an invalid reconciliation time", () => {
  assert.throws(() => hostedDiscoveryStaleCutoffs("not-a-date"), TypeError);
});
