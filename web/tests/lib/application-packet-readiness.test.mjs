import assert from "node:assert/strict";
import test from "node:test";

import { applicationPacketReadiness } from "../../src/lib/hosted/application-packet-readiness.ts";

const base = {
  jobId: "job_1",
  resumeId: "resume_1",
  evidenceIds: ["evidence_1"],
  professionalSummary: "Source-backed summary",
  coverNote: "",
  answers: [],
};

test("a complete packet is ready without requiring invented optional answers", () => {
  assert.deepEqual(applicationPacketReadiness(base).map((check) => check.done), [true, true, true, true, true]);
});

test("a pasted question with no answer is visibly incomplete", () => {
  const checks = applicationPacketReadiness({ ...base, answers: [{ question: "Why this role?", answer: "" }] });
  assert.equal(checks.at(-1)?.done, false);
});

test("a blank question does not force the user to invent an answer", () => {
  const checks = applicationPacketReadiness({ ...base, answers: [{ question: " ", answer: "" }] });
  assert.equal(checks.at(-1)?.done, true);
});

test("a packet without pinned verified evidence is visibly incomplete", () => {
  const checks = applicationPacketReadiness({ ...base, evidenceIds: [] });
  assert.equal(checks.find((check) => check.label === "Verified evidence pinned")?.done, false);
});
