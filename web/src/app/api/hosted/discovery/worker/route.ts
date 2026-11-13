import { Receiver } from "@upstash/qstash";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  completeHostedDiscoveryRun,
  failHostedDiscoveryRun,
  getHostedProfile,
  startHostedDiscoveryRun,
} from "@/lib/hosted/db/repository";
import { executeHostedDiscovery } from "@/lib/hosted/discovery-service";

export const maxDuration = 300;

const payloadSchema = z.object({
  ownerId: z.string().trim().min(1).max(255),
  runId: z.uuid(),
}).strict();

function receiverFromEnvironment() {
  const currentSigningKey = String(process.env.QSTASH_CURRENT_SIGNING_KEY || "").trim();
  const nextSigningKey = String(process.env.QSTASH_NEXT_SIGNING_KEY || "").trim();
  if (!currentSigningKey || !nextSigningKey) throw new Error("QStash signing keys are not configured.");
  return new Receiver({ currentSigningKey, nextSigningKey });
}

function publicRequestUrl(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",", 1)[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.trim();
  if (!host) throw new Error("Public request host is unavailable.");

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",", 1)[0]?.trim();
  const protocol = forwardedProto === "http" ? "http" : "https";
  return `${protocol}://${host}${request.nextUrl.pathname}${request.nextUrl.search}`;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("upstash-signature");
  if (!signature) return NextResponse.json({ error: "Missing queue signature." }, { status: 401 });

  try {
    const upstashRegion = request.headers.get("upstash-region");
    const verified = await receiverFromEnvironment().verify({
      signature,
      body,
      // QStash signs the public destination. On Vercel, request.url may use an
      // internal deployment origin, so reconstruct the externally visible URL
      // from the forwarded host before enforcing the signed subject.
      url: publicRequestUrl(request),
      upstashRegion: upstashRegion ?? undefined,
    });
    if (!verified) return NextResponse.json({ error: "Invalid queue signature." }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Invalid queue signature." }, { status: 401 });
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid discovery payload." }, { status: 400 });
  }
  const parsed = payloadSchema.safeParse(decoded);
  if (!parsed.success) return NextResponse.json({ error: "Invalid discovery payload." }, { status: 400 });
  const { ownerId, runId } = parsed.data;

  try {
    const claim = await startHostedDiscoveryRun(ownerId, runId);
    if (claim.state === "missing") return NextResponse.json({ error: "Discovery run not found." }, { status: 404 });
    if (claim.state === "complete" || claim.state === "running") {
      return NextResponse.json({ accepted: true, state: claim.state });
    }

    const profile = await getHostedProfile(ownerId);
    if (!profile.search?.targetRoles?.length) throw new Error("Search profile is incomplete.");
    const result = await executeHostedDiscovery(ownerId, profile.search);
    await completeHostedDiscoveryRun(ownerId, runId, {
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
    const message = error instanceof Error ? error.message : "Discovery worker failed.";
    await failHostedDiscoveryRun(ownerId, runId, message).catch(() => undefined);
    return NextResponse.json({ error: "Discovery worker failed." }, { status: 500 });
  }
}
