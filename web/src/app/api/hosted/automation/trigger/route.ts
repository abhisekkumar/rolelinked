import { Receiver } from "@upstash/qstash";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  claimHostedDiscoveryRun,
  completeHostedDiscoveryRun,
  createHostedDiscoveryRun,
  failHostedDiscoveryRun,
  getHostedProfile,
  startHostedDiscoveryRun,
} from "@/lib/hosted/db/repository";
import { executeHostedDiscovery } from "@/lib/hosted/discovery-service";

export const maxDuration = 300;

const payloadSchema = z.object({ ownerId: z.string().trim().min(1).max(255) }).strict();

function receiver() {
  const currentSigningKey = String(process.env.QSTASH_CURRENT_SIGNING_KEY || "").trim();
  const nextSigningKey = String(process.env.QSTASH_NEXT_SIGNING_KEY || "").trim();
  if (!currentSigningKey || !nextSigningKey) throw new Error("QStash signing keys are not configured.");
  return new Receiver({ currentSigningKey, nextSigningKey });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("upstash-signature");
  if (!signature) return NextResponse.json({ error: "Missing queue signature." }, { status: 401 });
  try {
    const verified = await receiver().verify({
      signature,
      body,
      upstashRegion: request.headers.get("upstash-region") || undefined,
    });
    if (!verified) return NextResponse.json({ error: "Invalid queue signature." }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Invalid queue signature." }, { status: 401 });
  }

  let decoded: unknown;
  try { decoded = JSON.parse(body); } catch {
    return NextResponse.json({ error: "Invalid schedule payload." }, { status: 400 });
  }
  const parsed = payloadSchema.safeParse(decoded);
  if (!parsed.success) return NextResponse.json({ error: "Invalid schedule payload." }, { status: 400 });
  const ownerId = parsed.data.ownerId;
  let runId: string | null = null;
  try {
    const profile = await getHostedProfile(ownerId);
    if (!profile.search?.targetRoles?.length) throw new Error("Search profile is incomplete.");
    const claimed = await claimHostedDiscoveryRun(ownerId, 30 * 60_000);
    if (!claimed) return NextResponse.json({ accepted: true, state: "cooldown" });
    const run = await createHostedDiscoveryRun(ownerId, { trigger: "scheduled", execution: "qstash-schedule" });
    runId = run.id;
    await startHostedDiscoveryRun(ownerId, run.id);
    const result = await executeHostedDiscovery(ownerId, profile.search);
    await completeHostedDiscoveryRun(ownerId, run.id, {
      sourcesChecked: result.sourceResults.length,
      providersSucceeded: result.sourceResults.length - result.failures.length,
      fetchedCount: result.fetched.length,
      qualifiedCount: result.classified.qualified.length,
      verificationCount: result.classified.verification.length,
      rejectedCount: result.classified.rejected.length,
      savedCount: result.saved.length,
      failures: result.failures,
      sourceResults: result.sourceResults,
    });
    return NextResponse.json({ accepted: true, state: "complete" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scheduled discovery failed.";
    if (runId) await failHostedDiscoveryRun(ownerId, runId, message).catch(() => undefined);
    return NextResponse.json({ error: "Scheduled discovery failed." }, { status: 500 });
  }
}
