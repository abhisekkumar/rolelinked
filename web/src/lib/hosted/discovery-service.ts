import "server-only";

import { classifyHostedJobs } from "@/lib/core/hosted-job-match.mjs";
import type { SearchProfile } from "@/lib/hosted/db/schema";
import { upsertHostedJobs } from "@/lib/hosted/db/repository";
import { fetchHostedDiscoverySources } from "@/lib/hosted/discovery-sources";

/**
 * One account-scoped discovery unit shared by the synchronous web route and
 * future background workers. Keeping fetch, classification, and persistence
 * behind this boundary prevents the hosted worker from becoming a second
 * matching engine.
 */
export async function executeHostedDiscovery(ownerId: string, profile: SearchProfile) {
  const sourceResults = await fetchHostedDiscoverySources();
  const fetched = sourceResults.flatMap((result) => result.jobs);
  const classified = classifyHostedJobs(fetched, profile, { minimumScore: 55, limit: 100 });
  const saved = await upsertHostedJobs(ownerId, classified.accepted);
  const failures = sourceResults
    .filter((result) => result.error)
    .map((result) => ({ source: result.source, error: result.error || "Source unavailable" }));

  return { sourceResults, fetched, classified, saved, failures };
}
