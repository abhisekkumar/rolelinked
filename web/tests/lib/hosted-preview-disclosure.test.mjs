import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(here, "../../src/components/hosted/today-workspace.tsx"), "utf8");

test("the Today workspace clearly distinguishes live account data from sample dashboard data", () => {
  assert.match(source, /Preview dashboard/);
  assert.match(source, /profile and private resumes are live/i);
  assert.match(source, /sample data/i);
  assert.match(source, /not an actual scan/i);
});
