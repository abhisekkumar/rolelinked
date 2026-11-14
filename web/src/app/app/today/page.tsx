import type { Metadata } from "next";

import { TodayWorkspace } from "@/components/hosted/today-workspace";
import { isHostedDatabaseConfigured } from "@/lib/hosted/config.mjs";
import { listHostedJobs } from "@/lib/hosted/db/repository";
import { getHostedIdentity } from "@/lib/hosted/identity";

export const metadata: Metadata = {
  title: "Today — RoleLinked",
  description: "A focused daily queue for job discovery, application review, follow-ups, and interview preparation.",
};

export default async function TodayPage() {
  const identity = await getHostedIdentity();
  const jobs = identity?.mode === "clerk" && isHostedDatabaseConfigured()
    ? await listHostedJobs(identity.userId)
    : [];
  return <TodayWorkspace jobs={jobs.map((job) => ({
    id: job.id,
    company: job.company,
    title: job.title,
    location: job.location,
    matchScore: job.matchScore,
    status: job.status,
    url: job.url,
  }))} />;
}
