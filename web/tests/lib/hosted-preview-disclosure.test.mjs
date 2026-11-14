import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(here, "../../src/components/hosted/today-workspace.tsx"), "utf8");
const page = readFileSync(path.join(here, "../../src/app/app/today/page.tsx"), "utf8");

test("the Today workspace renders tenant pipeline data instead of sample metrics", () => {
  assert.match(page, /listHostedJobs\(identity\.userId\)/);
  assert.match(source, /Live private workspace/);
  assert.match(source, /numbers below come from this account&apos;s Neon pipeline/i);
  assert.doesNotMatch(source, /Sample discovery snapshot/);
  assert.doesNotMatch(source, /const focusItems/);
});
