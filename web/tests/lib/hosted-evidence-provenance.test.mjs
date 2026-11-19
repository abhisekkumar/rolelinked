import assert from "node:assert/strict";
import test from "node:test";

import { applyEvidenceDecision } from "../../src/lib/hosted/evidence-provenance.mjs";

const current = {
  statement: "Reduced processing time by 30%.",
  verificationState: "derived-unverified",
};

test("evidence review exposes four distinct truthful outcomes", () => {
  assert.deepEqual(applyEvidenceDecision(current, { action: "confirm" }), {
    statement: current.statement,
    verificationState: "verified",
  });
  assert.deepEqual(applyEvidenceDecision(current, {
    action: "correct",
    statement: "Reduced processing time after the migration.",
  }), {
    statement: "Reduced processing time after the migration.",
    verificationState: "corrected",
  });
  assert.equal(
    applyEvidenceDecision(current, { action: "narrative-only" }).verificationState,
    "narrative-only",
  );
  assert.equal(
    applyEvidenceDecision(current, { action: "cannot-confirm" }).verificationState,
    "user-cannot-confirm",
  );
});

test("a correction requires candidate-supplied replacement text", () => {
  assert.throws(
    () => applyEvidenceDecision(current, { action: "correct", statement: " " }),
    /corrected evidence statement/i,
  );
});

test("narrative-only and cannot-confirm outcomes never decay into verified facts", () => {
  for (const verificationState of ["narrative-only", "user-cannot-confirm"]) {
    assert.throws(
      () => applyEvidenceDecision({ ...current, verificationState }, { action: "confirm" }),
      /durable/i,
    );
  }
});

test("arbitrary browser-supplied states are not evidence decisions", () => {
  assert.throws(
    () => applyEvidenceDecision(current, { action: "verified" }),
    /valid evidence decision/i,
  );
});
