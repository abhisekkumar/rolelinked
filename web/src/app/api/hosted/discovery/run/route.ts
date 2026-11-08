import { NextResponse } from "next/server";

import { rankHostedJobs } from "@/lib/core/hosted-job-match.mjs";
import { isHostedDatabaseConfigured } from "@/lib/hosted/config.mjs";
import { claimHostedDiscoveryRun, getHostedProfile, upsertHostedJobs } from "@/lib/hosted/db/repository";
import { fetchHostedDiscoverySources } from "@/lib/hosted/discovery-sources";
import { requireHostedUserId } from "@/lib/hosted/identity";
import { toHostedJobView } from "@/lib/hosted/job-view";

export const maxDuration = 60;

export async function POST() {
  try {
    const ownerId = await requireHostedUserId();
    if (!isHostedDatabaseConfigured()) {
      return NextResponse.json({ error: "Job storage is not configured yet." }, { status: 503 });
    }
    const profile = await getHostedProfile(ownerId);
    if (!profile.search?.targetRoles?.length) {
      return NextResponse.json(
        { error: "Add at least one target role in your preferences before running discovery." },
        { status: 409 },
      );
    }
    const claimed = await claimHostedDiscoveryRun(ownerId);
    if (!claimed) {
      return NextResponse.json(
        { error: "Discovery just ran for this account. Try again in a few minutes." },
        { status: 429, headers: { "Retry-After": "300" } },
      );
    }

    const sourceResults = await fetchHostedDiscoverySources();
    const fetched = sourceResults.flatMap((result) => result.jobs);
    const ranked = rankHostedJobs(fetched, profile.search, { minimumScore: 35, limit: 100 });
    const saved = await upsertHostedJobs(ownerId, ranked);
    const failures = sourceResults
      .filter((result) => result.error)
      .map((result) => ({ source: result.source, error: result.error }));

    return NextResponse.json({
      run: {
        sourcesChecked: sourceResults.length,
        providersSucceeded: sourceResults.length - failures.length,
        fetched: fetched.length,
        qualified: ranked.length,
        saved: saved.length,
        failures,
        completedAt: new Date().toISOString(),
      },
      jobs: saved.map(toHostedJobView),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Discovery could not run.";
    const status = message === "Authentication required." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
