import assert from "node:assert/strict";
import test from "node:test";

import {
  artifactContentSha256,
  artifactEvidenceIds,
  artifactVersionDiff,
} from "../../src/lib/hosted/artifact-version-core.mjs";

test("artifact hashes are stable across object key order", () => {
  assert.equal(
    artifactContentSha256({ blocks: [], name: "Ada" }),
    artifactContentSha256({ name: "Ada", blocks: [] }),
  );
});

test("artifact evidence links are deduplicated", () => {
  assert.deepEqual(artifactEvidenceIds({ blocks: [
    { evidenceIds: ["one", "two"] },
    { evidenceIds: ["two", "three"] },
  ] }), ["one", "two", "three"]);
});

test("artifact diffs preserve reviewable block identities", () => {
  const previous = { blocks: [{ id: "a", text: "Old" }, { id: "b", text: "Keep" }] };
  const next = { blocks: [{ id: "a", text: "New" }, { id: "c", text: "Add" }] };
  assert.deepEqual(artifactVersionDiff(previous, next), {
    added: ["c"],
    removed: ["b"],
    changed: ["a"],
    unchanged: [],
  });
});
