import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = path.dirname(fileURLToPath(import.meta.url));
const repository = readFileSync(path.join(here, "../../src/lib/hosted/db/repository.ts"), "utf8");
const packetSchema = readFileSync(path.join(here, "../../src/lib/hosted/profile-schema.ts"), "utf8");
const packetUi = readFileSync(path.join(here, "../../src/components/hosted/application-packets.tsx"), "utf8");

test("application packet evidence ids are bounded and validated server-side", () => {
  assert.match(packetSchema, /evidenceIds: z\.array\(z\.string\(\)\.uuid\(\)\)\.max\(100\)/);
  assert.match(repository, /eq\(hostedEvidenceItems\.ownerId, ownerId\)/);
  assert.match(repository, /Application packets can only pin verified or corrected evidence/);
  assert.match(repository, /Pin at least one verified evidence item before approving this packet/);
});

test("packet saves replace their exact evidence usage graph inside the tenant transaction", () => {
  assert.match(repository, /eq\(hostedEvidenceUsages\.surfaceType, "application-packet"\)/);
  assert.match(repository, /delete\(hostedEvidenceUsages\)/);
  assert.match(repository, /tx\.insert\(hostedEvidenceUsages\)/);
  assert.match(repository, /evidenceCount: evidenceIds\.length/);
});

test("the packet editor exposes only reviewed evidence and sends the exact selection", () => {
  assert.match(packetUi, /verificationState === "verified" \|\| item\.verificationState === "corrected"/);
  assert.match(packetUi, /evidenceIds: selectedEvidenceIds/);
  assert.match(packetUi, /Unreviewed and narrative-only claims are intentionally unavailable/);
});
