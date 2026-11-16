import "server-only";

import { classifyHostedJobs } from "@/lib/core/hosted-job-match.mjs";
import type { SearchProfile } from "@/lib/hosted/db/schema";
import { listHostedSourcePreferences, upsertHostedJobs } from "@/lib/hosted/db/repository";
import {
  fetchHostedDiscoverySources,
  HOSTED_SOURCE_CATALOG,
} from "@/lib/hosted/discovery-sources";

/**
 * One account-scoped discovery unit shared by the synchronous web route and
 * future background workers. Keeping fetch, classification, and persistence
 * behind this boundary prevents the hosted worker from becoming a second
 * matching engine.
 */
export async function executeHostedDiscovery(ownerId: string, profile: SearchProfile) {
  const preferences = await listHostedSourcePreferences(ownerId);
  const preferenceByKey = new Map(preferences.map((preference) => [preference.sourceKey, preference.enabled]));
  // Preferences are overrides. New lightweight feeds may opt in by default,
  // while regional or heavier catalogs stay visible but paused until chosen.
  const enabledSourceKeys = HOSTED_SOURCE_CATALOG
    .filter((source) => preferenceByKey.get(source.key) ?? source.defaultEnabled)
    .map((source) => source.key);
  const sourceResults = await fetchHostedDiscoverySources(enabledSourceKeys);
  const fetched = sourceResults.flatMap((result) => result.jobs);
  const classified = classifyHostedJobs(fetched, profile, { minimumScore: 55, limit: 100 });
  const saved = await upsertHostedJobs(ownerId, classified.accepted);
  const failures = sourceResults
    .filter((result) => result.error)
    .map((result) => ({ source: result.source, error: result.error || "Source unavailable" }));

  return { sourceResults, fetched, classified, saved, failures };
}
