function sentence(value) {
  const text = String(value || "").trim();
  return !text || /[.!?]$/.test(text) ? text : `${text}.`;
}

export function composeGroundedDraft({ kind, job, evidence }) {
  const citations = evidence.map((item) => ({ evidenceId: item.id, title: item.title, sourceLabel: item.sourceLabel }));
  const claims = evidence.map((item) => ({ text: sentence(item.statement), evidenceIds: [item.id] }));
  if (kind === "resume-summary") {
    return { kind, text: claims.map((claim) => claim.text).join(" "), claims, citations, unknowns: [] };
  }
  if (kind === "cover-letter") {
    const opening = `Dear hiring team,\n\nI am applying for the ${job.title} role at ${job.company}.`;
    const proof = claims.map((claim) => claim.text).join(" ");
    return { kind, text: `${opening}\n\n${proof}\n\nThank you for reviewing my application.`, claims, citations, unknowns: [] };
  }
  const text = `Based on my verified experience: ${claims.map((claim) => claim.text).join(" ")}`;
  return { kind: "screening-answer", text, claims, citations, unknowns: ["Add motivation or company-specific context only if you can personally confirm it."] };
}

export const GROUNDED_DRAFTING_PROVIDER = Object.freeze({
  provider: "deterministic-source-composer",
  model: "grounded-v1",
  costMicros: 0,
});
