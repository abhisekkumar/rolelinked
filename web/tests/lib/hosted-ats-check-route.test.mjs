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

test("ATS checker discards extracted text while retaining a reproducible diagnostic", () => {
  assert.match(route, /readPrivateObject/);
  assert.match(route, /saveHostedAtsReport/);
  assert.match(route, /resumeSha256: resumeRecord\.version\.sha256/);
  assert.match(route, /Extracted resume text is discarded/);
  const saveStart = route.indexOf("const report = await saveHostedAtsReport");
  const savedPayload = route.slice(saveStart, route.indexOf("return NextResponse.json", saveStart));
  assert.doesNotMatch(savedPayload, /extracted\.text/);
});
