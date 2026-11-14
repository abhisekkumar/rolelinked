import type { Metadata } from "next";

import { HostedJobsWorkspace } from "@/components/hosted/hosted-jobs-workspace";
import { screenHostedDiscoveryJobs } from "@/lib/core/hosted-job-match.mjs";
import { isHostedDatabaseConfigured } from "@/lib/hosted/config.mjs";
import { getHostedProfile, listHostedJobs } from "@/lib/hosted/db/repository";
import { getHostedIdentity } from "@/lib/hosted/identity";
import { toHostedJobView } from "@/lib/hosted/job-view";

export const metadata: Metadata = { title: "Pipeline — RoleLinked" };

export default async function PipelinePage() {
  const identity = await getHostedIdentity();
  let jobs = [];
  if (identity?.mode === "clerk" && isHostedDatabaseConfigured()) {
    jobs = await listHostedJobs(identity.userId);
    const profile = await getHostedProfile(identity.userId);
    if (profile.search) jobs = screenHostedDiscoveryJobs(jobs, profile.search);
  }
  return <HostedJobsWorkspace initialJobs={jobs.map(toHostedJobView)} mode="pipeline" />;
}
