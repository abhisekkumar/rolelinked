import { createHash } from "node:crypto";

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, normalize(item)]),
    );
  }
  return value;
}

export function artifactContentSha256(content) {
  return createHash("sha256").update(JSON.stringify(normalize(content))).digest("hex");
}

export function artifactVersionDiff(previousContent, nextContent) {
  const previous = new Map((previousContent?.blocks || []).map((block) => [block.id, block]));
  const next = new Map((nextContent?.blocks || []).map((block) => [block.id, block]));
  const added = [];
  const removed = [];
  const changed = [];

  for (const [id, block] of next) {
    if (!previous.has(id)) added.push(id);
    else if (JSON.stringify(normalize(previous.get(id))) !== JSON.stringify(normalize(block))) changed.push(id);
  }
  for (const id of previous.keys()) {
    if (!next.has(id)) removed.push(id);
  }
  return { added, removed, changed, unchanged: [...next.keys()].filter((id) => !added.includes(id) && !changed.includes(id)) };
}

export function artifactEvidenceIds(content) {
  return [...new Set((content?.blocks || []).flatMap((block) => block.evidenceIds || []))];
}
