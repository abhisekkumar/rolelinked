export type ApplicationAnswerDraft = { question: string; answer: string };

type ApplicationPacketReadinessInput = {
  jobId: string;
  resumeId: string;
  resumeArtifactVersionId: string;
  coverLetterVersionId: string;
  atsReportId: string;
  evidenceIds: string[];
  professionalSummary: string;
  coverNote: string;
  answers: ApplicationAnswerDraft[];
};

export function applicationPacketReadiness(input: ApplicationPacketReadinessInput) {
  return [
    { label: "Role selected", done: Boolean(input.jobId) },
    { label: "Resume source selected", done: Boolean(input.resumeId) },
    { label: "Exact resume version pinned", done: Boolean(input.resumeArtifactVersionId) },
    { label: "Cover-letter version pinned", done: Boolean(input.coverLetterVersionId) },
    { label: "ATS report pinned", done: Boolean(input.atsReportId) },
    { label: "Verified evidence pinned", done: input.evidenceIds.length > 0 },
    { label: "Supported draft added", done: Boolean(input.professionalSummary.trim() || input.coverNote.trim()) },
    {
      label: "Questions answered or left out",
      done: input.answers.every((row) => !row.question.trim() || Boolean(row.answer.trim())),
    },
  ];
}
