import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = path.dirname(fileURLToPath(import.meta.url));
const resumeRoute = readFileSync(path.join(here, "../../src/app/api/hosted/resumes/[id]/route.ts"), "utf8");
const documentRoute = readFileSync(path.join(here, "../../src/app/api/hosted/documents/[id]/route.ts"), "utf8");
const repository = readFileSync(path.join(here, "../../src/lib/hosted/db/repository.ts"), "utf8");

test("resume deletion removes every immutable Blob version before tenant metadata", () => {
  assert.match(resumeRoute, /listHostedResumeStorageKeys\(ownerId, id\)/);
  assert.match(resumeRoute, /Promise\.all\(records\.map\(\(record\) => deletePrivateObject\(record\.storageKey\)\)\)/);
  assert.ok(resumeRoute.indexOf("deletePrivateObject(record.storageKey)") < resumeRoute.indexOf("deleteHostedResumeRecord(ownerId, id)"));
  assert.match(repository, /delete\(resumes\)/);
});

test("document deletion removes the private Blob and tenant metadata", () => {
  assert.match(documentRoute, /deletePrivateObject\(document\.storageKey\)/);
  assert.ok(documentRoute.indexOf("deletePrivateObject(document.storageKey)") < documentRoute.indexOf("deleteHostedDocumentRecord(ownerId, id)"));
  assert.match(repository, /delete\(documents\)/);
});

test("replace workflows clean newly uploaded objects on database failure", () => {
  assert.match(resumeRoute, /if \(uploadedPathname\).*deletePrivateObject\(uploadedPathname\)/s);
  assert.match(documentRoute, /if \(uploadedPathname\).*deletePrivateObject\(uploadedPathname\)/s);
});
