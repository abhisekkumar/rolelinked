import assert from "node:assert/strict";
import test from "node:test";

import { packetApprovalFingerprint, packetApprovalPayload } from "../../src/lib/hosted/packet-approval-core.mjs";

test("packet fingerprints are stable but material-change sensitive", () => {
  const payload = packetApprovalPayload({ jobId: "job", evidenceIds: ["b", "a", "a"], sourceSnapshot: { title: "Role" }, content: { answer: "Yes" } });
  assert.equal(packetApprovalFingerprint(payload), packetApprovalFingerprint({ ...payload, evidenceIds: ["a", "b"] }));
  assert.notEqual(packetApprovalFingerprint(payload), packetApprovalFingerprint({ ...payload, content: { answer: "No" } }));
});
