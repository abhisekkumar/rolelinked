import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = path.dirname(fileURLToPath(import.meta.url));
const route = readFileSync(path.join(here, "../../src/app/api/hosted/ats-check/route.ts"), "utf8");

test("ATS checker authenticates and scopes both selected records to the current tenant", () => {
  assert.match(route, /requireHostedUserId/);
  assert.match(route, /getHostedJob\(ownerId, parsed\.data\.jobId\)/);
  assert.match(route, /getHostedResumeVersion\(ownerId, parsed\.data\.resumeId\)/);
});

test("ATS checker reads a private object on demand without persisting extracted text", () => {
  assert.match(route, /readPrivateObject/);
  assert.doesNotMatch(route, /insert|updateHosted|createHosted/i);
  assert.match(route, /report are not persisted/i);
});
