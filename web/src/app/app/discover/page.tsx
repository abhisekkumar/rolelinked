import type { Metadata } from "next";

import { HostedJobsWorkspace } from "@/components/hosted/hosted-jobs-workspace";
import { isHostedDatabaseConfigured } from "@/lib/hosted/config.mjs";
import { listHostedDiscoveryRuns, listHostedJobs } from "@/lib/hosted/db/repository";
import { toHostedDiscoveryRunView } from "@/lib/hosted/discovery-run-view";
import { getHostedIdentity } from "@/lib/hosted/identity";
import { toHostedJobView } from "@/lib/hosted/job-view";

export const metadata: Metadata = { title: "Discover — RoleLinked" };

export default async function DiscoverPage() {
  const identity = await getHostedIdentity();
  let jobs = identity?.mode === "clerk" && isHostedDatabaseConfigured()
    ? await listHostedJobs(identity.userId)
    : [];
  const runs = identity?.mode === "clerk" && isHostedDatabaseConfigured()
    ? await listHostedDiscoveryRuns(identity.userId, 5)
    : [];
  return <HostedJobsWorkspace initialJobs={jobs.map(toHostedJobView)} initialRuns={runs.map(toHostedDiscoveryRunView)} mode="discover" />;
}
