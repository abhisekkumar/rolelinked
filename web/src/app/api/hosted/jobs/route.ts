import { NextResponse } from "next/server";
import { z } from "zod";

import { canonicalizeJobUrl } from "@/lib/core/hosted-job-match.mjs";
import { isHostedDatabaseConfigured } from "@/lib/hosted/config.mjs";
import { listHostedJobs, upsertHostedJobs } from "@/lib/hosted/db/repository";
import { requireHostedUserId } from "@/lib/hosted/identity";
import { toHostedJobView } from "@/lib/hosted/job-view";

const manualJobSchema = z.object({
  url: z.url().max(2_000),
  company: z.string().trim().min(1).max(160),
  title: z.string().trim().min(1).max(200),
  location: z.string().trim().max(200).optional().default(""),
});

function unavailable() {
  return NextResponse.json({ error: "Job storage is not configured yet." }, { status: 503 });
}

export async function GET(request: Request) {
  try {
    const ownerId = await requireHostedUserId();
    if (!isHostedDatabaseConfigured()) return unavailable();
    const status = new URL(request.url).searchParams.get("status") || undefined;
    const jobs = await listHostedJobs(ownerId, { status });
    return NextResponse.json({ jobs: jobs.map(toHostedJobView) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load jobs.";
    const status = message === "Authentication required." ? 401 : message === "Unsupported pipeline status." ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const ownerId = await requireHostedUserId();
    if (!isHostedDatabaseConfigured()) return unavailable();
    const parsed = manualJobSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid job URL, company, and role title." }, { status: 400 });
    }
    const canonicalUrl = canonicalizeJobUrl(parsed.data.url);
    const [job] = await upsertHostedJobs(ownerId, [{
      ...parsed.data,
      source: "Manual",
      canonicalUrl,
      remoteSignal: /remote/i.test(parsed.data.location) ? "remote" : "unknown",
      sponsorshipSignal: "unknown",
      matchReasons: ["Added by you"],
    }]);
    return NextResponse.json({ job: toHostedJobView(job) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add the job.";
    const status = message === "Authentication required." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
