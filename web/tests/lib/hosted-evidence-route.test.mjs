import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = path.dirname(fileURLToPath(import.meta.url));
const collectionRoute = readFileSync(path.join(here, "../../src/app/api/hosted/evidence/route.ts"), "utf8");
const itemRoute = readFileSync(path.join(here, "../../src/app/api/hosted/evidence/[id]/route.ts"), "utf8");

test("Evidence Vault collection operations use only the authenticated tenant", () => {
  assert.match(collectionRoute, /requireHostedUserId/);
  assert.match(collectionRoute, /listHostedEvidence\(ownerId\)/);
  assert.match(collectionRoute, /createHostedEvidence\(ownerId, parsed\.data\)/);
  assert.doesNotMatch(collectionRoute, /ownerId:\s*(await request|request\.|parsed\.data)/);
});

test("evidence decisions are validated and scoped before mutation", () => {
  assert.match(itemRoute, /requireHostedUserId/);
  assert.match(itemRoute, /getHostedEvidenceItem\(ownerId, id\)/);
  assert.match(itemRoute, /hostedEvidenceDecisionSchema\.safeParse/);
  assert.match(itemRoute, /decideHostedEvidence\(ownerId, id, parsed\.data\)/);
  assert.match(itemRoute, /deleteHostedEvidence\(ownerId, id\)/);
});
