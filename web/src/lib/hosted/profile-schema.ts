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

export type HostedSearchProfileInput = z.infer<typeof hostedSearchProfileSchema>;
