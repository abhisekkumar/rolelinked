import { z } from "zod";

function compactStringList(minimum = 0) {
  return z
    .array(z.string().trim().min(2).max(100))
    .min(minimum)
    .max(30)
    .transform((values) => [...new Set(values.map((value) => value.trim()))]);
}

export const hostedSearchProfileSchema = z
  .object({
    targetRoles: compactStringList(1),
    prioritySkills: compactStringList().default([]),
    excludedRoles: compactStringList().default([]),
    locations: compactStringList(1),
    remotePreference: z.enum(["remote", "hybrid", "onsite", "flexible"]),
    compensationCurrency: z.string().trim().regex(/^[A-Z]{3}$/),
    compensationMinimum: z.number().int().min(0).max(10_000_000).nullable(),
    compensationTarget: z.number().int().min(0).max(10_000_000).nullable(),
    sponsorshipRequired: z.boolean(),
    approvedI140: z.boolean(),
    cadencePreference: z.enum(["daily", "twice-daily", "weekly"]),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.compensationMinimum !== null
      && value.compensationTarget !== null
      && value.compensationTarget < value.compensationMinimum
    ) {
      context.addIssue({
        code: "custom",
        path: ["compensationTarget"],
        message: "Target compensation must be at least the minimum.",
      });
    }
  });

export const hostedResumeMetadataSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    roleType: z.string().trim().min(2).max(100),
  })
  .strict();

export const hostedDocumentMetadataSchema = z
  .object({
    title: z.string().trim().min(2).max(140),
    kind: z.enum(["cover-letter", "portfolio", "work-sample", "reference", "other"]),
  })
  .strict();

const evidenceCategorySchema = z.enum([
  "experience",
  "project",
  "skill",
  "education",
  "certification",
  "achievement",
  "work-authorization",
  "publication",
  "interview-story",
  "other",
]);

const evidenceSourceTypeSchema = z.enum([
  "resume",
  "document",
  "user-statement",
  "manual-confirmation",
]);

export const hostedEvidenceItemSchema = z
  .object({
    category: evidenceCategorySchema,
    title: z.string().trim().min(2).max(140),
    statement: z.string().trim().min(2).max(8_000),
    sourceType: evidenceSourceTypeSchema,
    sourceResumeId: z.string().uuid().nullable().optional(),
    sourceDocumentId: z.string().uuid().nullable().optional(),
    sourceLabel: z.string().trim().min(2).max(240),
    sourceExcerpt: z.string().trim().min(2).max(8_000),
    isQuantified: z.boolean().default(false),
  })
  .strict()
  .superRefine((value, context) => {
    const hasResume = Boolean(value.sourceResumeId);
    const hasDocument = Boolean(value.sourceDocumentId);
    const validReference =
      (value.sourceType === "resume" && hasResume && !hasDocument)
      || (value.sourceType === "document" && hasDocument && !hasResume)
      || (["user-statement", "manual-confirmation"].includes(value.sourceType)
        && !hasResume
        && !hasDocument);
    if (!validReference) {
      context.addIssue({
        code: "custom",
        path: ["sourceType"],
        message: "Choose one source that belongs to this evidence item.",
      });
    }
  });

export const hostedEvidenceDecisionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("confirm") }).strict(),
  z.object({ action: z.literal("correct"), statement: z.string().trim().min(2).max(8_000) }).strict(),
  z.object({ action: z.literal("narrative-only") }).strict(),
  z.object({ action: z.literal("cannot-confirm") }).strict(),
]);

export const hostedApplicationPacketSchema = z
  .object({
    jobId: z.string().uuid(),
    resumeId: z.string().uuid().nullable().optional(),
    status: z.enum(["draft", "review", "approved", "archived"]).default("draft"),
    reviewNotes: z.string().trim().max(2_000).nullable().optional(),
    content: z
      .object({
        professionalSummary: z.string().trim().max(4_000).default(""),
        coverNote: z.string().trim().max(12_000).default(""),
        answers: z
          .array(z.object({ question: z.string().trim().min(1).max(1_000), answer: z.string().trim().max(4_000) }))
          .max(30)
          .default([]),
      })
      .strict(),
  })
  .strict();

export const hostedAutomationScheduleSchema = z
  .object({
    enabled: z.boolean(),
    cadence: z.enum(["daily", "twice-daily", "weekly"]),
    localTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    timezone: z.string().trim().min(1).max(100),
  })
  .strict();

export const hostedSourcePreferenceSchema = z
  .object({
    sourceKey: z.string().trim().min(2).max(100).regex(/^[a-z0-9:_-]+$/i),
    enabled: z.boolean(),
  })
  .strict();

export type HostedSearchProfileInput = z.infer<typeof hostedSearchProfileSchema>;
