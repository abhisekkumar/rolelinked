import { NextResponse } from "next/server";
import { z } from "zod";

import { isHostedDatabaseConfigured } from "@/lib/hosted/config.mjs";
import { updateHostedJobStatus } from "@/lib/hosted/db/repository";
import { requireHostedUserId } from "@/lib/hosted/identity";
import { toHostedJobView } from "@/lib/hosted/job-view";

const statusSchema = z.object({
  status: z.string().trim().min(1).max(32),
  note: z.string().trim().max(500).optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ownerId = await requireHostedUserId();
    if (!isHostedDatabaseConfigured()) {
      return NextResponse.json({ error: "Job storage is not configured yet." }, { status: 503 });
    }
    const payload = statusSchema.safeParse(await request.json());
    if (!payload.success) return NextResponse.json({ error: "Choose a valid pipeline status." }, { status: 400 });
    const { id } = await context.params;
    const job = await updateHostedJobStatus(ownerId, id, payload.data.status, payload.data.note);
    if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });
    return NextResponse.json({ job: toHostedJobView(job) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update this job.";
    const status = message === "Authentication required." ? 401 : message === "Unsupported pipeline status." ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
