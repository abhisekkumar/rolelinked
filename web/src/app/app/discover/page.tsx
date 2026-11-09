import type { Metadata } from "next";

import { HostedJobsWorkspace } from "@/components/hosted/hosted-jobs-workspace";
import { screenHostedDiscoveryJobs } from "@/lib/core/hosted-job-match.mjs";
import { isHostedDatabaseConfigured } from "@/lib/hosted/config.mjs";
import { getHostedProfile, listHostedJobs } from "@/lib/hosted/db/repository";
import { getHostedIdentity } from "@/lib/hosted/identity";
import { toHostedJobView } from "@/lib/hosted/job-view";

export const metadata: Metadata = { title: "Discover — RoleLinked" };

export default async function DiscoverPage() {
  const identity = await getHostedIdentity();
  let jobs = identity?.mode === "clerk" && isHostedDatabaseConfigured()
    ? await listHostedJobs(identity.userId)
    : [];
  if (identity?.mode === "clerk" && jobs.length) {
    const profile = await getHostedProfile(identity.userId);
    if (profile.search) jobs = screenHostedDiscoveryJobs(jobs, profile.search);
  }
  return <HostedJobsWorkspace initialJobs={jobs.map(toHostedJobView)} mode="discover" />;
}
