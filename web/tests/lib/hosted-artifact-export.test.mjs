import assert from "node:assert/strict";
import test from "node:test";
import { renderArtifactHtml, renderArtifactMarkdown, renderArtifactTex } from "../../src/lib/hosted/artifact-export.mjs";

const artifact = { title: "Data resume" };
const version = { content: { name: "Ada <L>", headline: "Engineer", contactLine: "ada@example.com", blocks: [{ heading: "Experience", text: "Built A & B", type: "experience" }] } };

test("artifact exports retain structured content in portable formats", () => {
  assert.match(renderArtifactMarkdown(artifact, version), /Built A & B/);
  assert.match(renderArtifactTex(artifact, version), /Built A \\& B/);
  assert.match(renderArtifactHtml(artifact, version), /Ada &lt;L&gt;/);
});
