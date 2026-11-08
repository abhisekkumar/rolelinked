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
};

/**
 * Explicitly select the fields that may cross the server/client boundary.
 * Tenant IDs, canonical dedupe keys, provider metadata, and internal timestamps
 * remain server-only even though the current user owns the record.
 */
export function toHostedJobView(job: HostedJob): HostedJobView {
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
  };
}
