import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const here = path.dirname(fileURLToPath(import.meta.url));
const route = readFileSync(path.join(here, "../../src/app/api/hosted/resumes/[id]/preview/route.ts"), "utf8");
const library = readFileSync(path.join(here, "../../src/components/hosted/resume-library.tsx"), "utf8");

test("resume preview remains authenticated, tenant-scoped, and non-cacheable", () => {
  assert.match(route, /requireHostedUserId/);
  assert.match(route, /getHostedResumeVersion\(ownerId, id\)/);
  assert.match(route, /content-disposition.*inline/s);
  assert.match(route, /cache-control.*private, no-store/s);
});

test("the library only offers browser preview for supported types", () => {
  assert.match(library, /PREVIEWABLE_RESUME_TYPES/);
  assert.match(library, /\/preview/);
  assert.match(library, /> Preview</);
});
