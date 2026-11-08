import type { Metadata } from "next";

import { HostedJobsWorkspace } from "@/components/hosted/hosted-jobs-workspace";
import { isHostedDatabaseConfigured } from "@/lib/hosted/config.mjs";
import { listHostedJobs } from "@/lib/hosted/db/repository";
import { getHostedIdentity } from "@/lib/hosted/identity";
import { toHostedJobView } from "@/lib/hosted/job-view";

export const metadata: Metadata = { title: "Discover — RoleLinked" };

export default async function DiscoverPage() {
  const identity = await getHostedIdentity();
  const jobs = identity?.mode === "clerk" && isHostedDatabaseConfigured()
    ? await listHostedJobs(identity.userId)
    : [];
  return <HostedJobsWorkspace initialJobs={jobs.map(toHostedJobView)} mode="discover" />;
}
