import assert from "node:assert/strict";
import test from "node:test";

import { composeGroundedDraft } from "../../src/lib/hosted/grounded-drafting.mjs";

const job = { company: "Acme", title: "Data Engineer" };
const evidence = [{ id: "e1", title: "Pipeline", statement: "Built batch pipelines", sourceLabel: "Resume v1" }];

test("grounded drafts preserve claim citations and introduce no qualification", () => {
  const draft = composeGroundedDraft({ kind: "cover-letter", job, evidence });
  assert.match(draft.text, /Built batch pipelines/);
  assert.deepEqual(draft.claims, [{ text: "Built batch pipelines.", evidenceIds: ["e1"] }]);
  assert.deepEqual(draft.citations[0], { evidenceId: "e1", title: "Pipeline", sourceLabel: "Resume v1" });
  assert.doesNotMatch(draft.text, /expert|years|percent/i);
});
