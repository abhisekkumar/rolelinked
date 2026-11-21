import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.join(here, "../../src/app/api/hosted");
const phase5Roots = ["application-packets", "artifacts", "ats-check", "drafting", "evidence"];

function collectFiles(root) {
  const pending = [root];
  const collected = [];

  while (pending.length > 0) {
    const directory = pending.pop();
    for (const entry of readdirSync(directory)) {
      const target = path.join(directory, entry);
      if (statSync(target).isDirectory()) pending.push(target);
      else collected.push(target);
    }
  }

  return collected;
}

test("Phase 5 routes expose no external submission, messaging, or authorization action", () => {
  const sources = phase5Roots.flatMap((name) => collectFiles(path.join(apiRoot, name))).map((file) => ({ file, source: readFileSync(file, "utf8") }));
  assert.ok(sources.length >= 8, "expected the complete Phase 5 route surface");
  for (const { file, source } of sources) {
    assert.doesNotMatch(source, /\b(?:submitApplication|sendMessage|authorizeExternal|dispatchApplication|applyToJob)\s*\(/, file);
    assert.doesNotMatch(source, /(?:linkedin|gmail|outlook|slack|twilio|sendgrid).*client/i, file);
  }
});

test("packet approval remains an internal fingerprinted state", () => {
  const repository = readFileSync(path.join(here, "../../src/lib/hosted/db/repository.ts"), "utf8");
  assert.match(repository, /approvalFingerprint/);
  assert.match(repository, /assertPacketStatus/);
  assert.doesNotMatch(repository, /submitApplication|sendMessage|applyToJob/);
});
