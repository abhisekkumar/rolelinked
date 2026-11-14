import type { HostedJob } from "@/lib/hosted/db/schema";

export type HostedJobView = {
  id: string;
  source: string;
  url: string;
  company: string;
  title: string;
  location: string;
  descriptionExcerpt: string;
  postedAt: string | null;
  discoveredAt: string;
  matchScore: number | null;
  matchReasons: string[];
  matchedSkills: string[];
  remoteSignal: string;
  sponsorshipSignal: string;
  compensationMinimum: number | null;
  compensationMaximum: number | null;
  status: string;
  statusUpdatedAt: string;
  matchTier: "qualified" | "verification" | "manual" | "legacy";
  verificationReasons: string[];
  untrustedSignals: string[];
};

function matchMetadata(job: HostedJob) {
  const value = job.sourceMetadata?.rolelinkedMatch;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      matchTier: job.source === "Manual" ? "manual" as const : "legacy" as const,
      verificationReasons: [] as string[],
      untrustedSignals: [] as string[],
    };
  }
  const record = value as Record<string, unknown>;
  const matchTier = record.tier === "qualified" ? "qualified" as const : "verification" as const;
  return {
    matchTier,
    verificationReasons: Array.isArray(record.verificationReasons)
      ? record.verificationReasons.filter((item): item is string => typeof item === "string")
      : [],
    untrustedSignals: Array.isArray(record.untrustedSignals)
      ? record.untrustedSignals.filter((item): item is string => typeof item === "string")
      : [],
  };
}

/**
 * Explicitly select the fields that may cross the server/client boundary.
 * Tenant IDs, canonical dedupe keys, provider metadata, and internal timestamps
 * remain server-only even though the current user owns the record.
 */
export function toHostedJobView(job: HostedJob): HostedJobView {
  const matching = matchMetadata(job);
  return {
    id: job.id,
    source: job.source,
    url: job.url,
    company: job.company,
    title: job.title,
    location: job.location,
    descriptionExcerpt: job.descriptionExcerpt,
    postedAt: job.postedAt?.toISOString() || null,
    discoveredAt: job.discoveredAt.toISOString(),
    matchScore: job.matchScore,
    matchReasons: job.matchReasons,
    matchedSkills: job.matchedSkills,
    remoteSignal: job.remoteSignal,
    sponsorshipSignal: job.sponsorshipSignal,
    compensationMinimum: job.compensationMinimum,
    compensationMaximum: job.compensationMaximum,
    status: job.status,
    statusUpdatedAt: job.statusUpdatedAt.toISOString(),
    ...matching,
  };
}
