export type ApplicationAnswerDraft = { question: string; answer: string };

type ApplicationPacketReadinessInput = {
  jobId: string;
  resumeId: string;
  evidenceIds: string[];
  professionalSummary: string;
  coverNote: string;
  answers: ApplicationAnswerDraft[];
};

export function applicationPacketReadiness(input: ApplicationPacketReadinessInput) {
  return [
    { label: "Role selected", done: Boolean(input.jobId) },
    { label: "Resume selected", done: Boolean(input.resumeId) },
    { label: "Verified evidence pinned", done: input.evidenceIds.length > 0 },
    { label: "Supported draft added", done: Boolean(input.professionalSummary.trim() || input.coverNote.trim()) },
    {
      label: "Questions answered or left out",
      done: input.answers.every((row) => !row.question.trim() || Boolean(row.answer.trim())),
    },
  ];
}
