import { NextResponse } from "next/server";
import { z } from "zod";

import { countHostedModelUsageSince, getHostedJob, getVerifiedHostedEvidence, recordHostedModelUsage } from "@/lib/hosted/db/repository";
import { composeGroundedDraft, GROUNDED_DRAFTING_PROVIDER } from "@/lib/hosted/grounded-drafting.mjs";
import { requireHostedUserId } from "@/lib/hosted/identity";

const requestSchema = z.object({
  jobId: z.string().uuid(),
  evidenceIds: z.array(z.string().uuid()).min(1).max(30),
  kind: z.enum(["resume-summary", "cover-letter", "screening-answer"]),
}).strict();

const DAILY_LIMIT = 50;

export async function POST(request: Request) {
  try {
    const ownerId = await requireHostedUserId();
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Choose a job, verified evidence, and draft type." }, { status: 400 });
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    const used = await countHostedModelUsageSince(ownerId, since);
    if (used >= DAILY_LIMIT) return NextResponse.json({ error: "Daily grounded-drafting limit reached. Try again tomorrow." }, { status: 429 });
    const [job, evidence] = await Promise.all([
      getHostedJob(ownerId, parsed.data.jobId),
      getVerifiedHostedEvidence(ownerId, parsed.data.evidenceIds),
    ]);
    if (!job) return NextResponse.json({ error: "The selected job was not found in this workspace." }, { status: 404 });
    const draft = composeGroundedDraft({ kind: parsed.data.kind, job, evidence });
    const inputCharacters = job.descriptionExcerpt.length + evidence.reduce((sum, item) => sum + item.statement.length + item.sourceExcerpt.length, 0);
    const outputCharacters = JSON.stringify(draft).length;
    await recordHostedModelUsage(ownerId, {
      ...GROUNDED_DRAFTING_PROVIDER,
      requestKind: parsed.data.kind,
      inputCharacters,
      outputCharacters,
    });
    return NextResponse.json({
      draft,
      provider: GROUNDED_DRAFTING_PROVIDER,
      usage: { used: used + 1, limit: DAILY_LIMIT },
      guardrail: "Only the archived job identity and your selected verified evidence were used. Listing text was treated as untrusted data, never as instructions.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create a grounded draft.";
    const status = message === "Authentication required." ? 401 : /verified|workspace/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
