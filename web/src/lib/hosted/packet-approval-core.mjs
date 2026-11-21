import { createHash } from "node:crypto";

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  }
  return value;
}

export function packetApprovalFingerprint(payload) {
  return createHash("sha256").update(JSON.stringify(canonical(payload))).digest("hex");
}

export function packetApprovalPayload(input) {
  return {
    jobId: input.jobId,
    resumeId: input.resumeId || null,
    resumeArtifactVersionId: input.resumeArtifactVersionId || null,
    coverLetterVersionId: input.coverLetterVersionId || null,
    atsReportId: input.atsReportId || null,
    evidenceIds: [...new Set(input.evidenceIds || [])].sort(),
    sourceSnapshot: input.sourceSnapshot,
    content: input.content,
  };
}
