import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
const provider = readFileSync(join(ROOT, "components/explore/explore-provider.tsx"), "utf8");
const results = readFileSync(join(ROOT, "components/explore/results-list.tsx"), "utf8");
const pipeline = readFileSync(join(ROOT, "components/pipeline/pipeline-provider.tsx"), "utf8");
const writer = readFileSync(join(ROOT, "lib/core/pipeline.ts"), "utf8");

test("Explore reports add success or failure instead of failing silently", () => {
  assert.match(provider, /setAddNotice\(\{ kind: "success"/);
  assert.match(provider, /setAddNotice\(\{\s*kind: "error"/);
  assert.match(provider, /if \(!r\.ok \|\| d\.error\) throw/);
  assert.match(results, /role="status"/);
  assert.match(results, /Adding \$\{adding\.size\}/);
});

test("Pipeline refetches its client snapshot after Explore adds jobs", () => {
  assert.match(pipeline, /addEventListener\("co-job-done", onJobDone\)/);
  assert.match(pipeline, /detail\?\.kind === "explore-add"\) refetch\(\)/);
  assert.match(pipeline, /removeEventListener\("co-job-done", onJobDone\)/);
});

test("the add writer uses system helpers from the code root and refuses duplicate URLs", () => {
  assert.match(writer, /path\.join\(careerOpsCodeRoot\(\), "lib", "local-today\.mjs"\)/);
  assert.match(writer, /new Set\(readInbox\(\)\.map\(\(job\) => job\.url\)\)/);
  assert.match(writer, /filter\(\(o\) => !existingUrls\.has\(o\.url\)\)/);
  assert.match(writer, /pipeline writer exited without a response/);
});
