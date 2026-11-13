import { NextRequest, NextResponse } from "next/server";

import {
  getHostedServiceReadiness,
  isHostedDatabaseConfigured,
  isHostedSchedulerConfigured,
} from "@/lib/hosted/config.mjs";
import {
  claimHostedDiscoveryRun,
  completeHostedDiscoveryRun,
  createHostedDiscoveryRun,
  failHostedDiscoveryRun,
  getHostedDiscoveryRun,
  getHostedProfile,
  listHostedDiscoveryRuns,
  setHostedDiscoveryRunMessageId,
  startHostedDiscoveryRun,
} from "@/lib/hosted/db/repository";
import { toHostedDiscoveryRunView } from "@/lib/hosted/discovery-run-view";
import { executeHostedDiscovery } from "@/lib/hosted/discovery-service";
import { requireHostedUserId } from "@/lib/hosted/identity";
import { queueHostedDiscovery } from "@/lib/hosted/qstash-discovery";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const ownerId = await requireHostedUserId();
    if (!isHostedDatabaseConfigured()) {
      return NextResponse.json({ error: "Job storage is not configured yet." }, { status: 503 });
    }
    const runId = request.nextUrl.searchParams.get("runId")?.trim();
    if (runId) {
      const record = await getHostedDiscoveryRun(ownerId, runId);
      if (!record) return NextResponse.json({ error: "Discovery run not found." }, { status: 404 });
      return NextResponse.json({ run: toHostedDiscoveryRunView(record) });
    }
    const runs = await listHostedDiscoveryRuns(ownerId, 5);
    return NextResponse.json({ runs: runs.map(toHostedDiscoveryRunView) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Discovery history is unavailable.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ownerId = await requireHostedUserId();
    if (!isHostedDatabaseConfigured()) {
      return NextResponse.json({ error: "Job storage is not configured yet." }, { status: 503 });
    }
    const profile = await getHostedProfile(ownerId);
    if (!profile.search?.targetRoles?.length) {
      return NextResponse.json(
        { error: "Add at least one target role in your preferences before running discovery." },
        { status: 409 },
      );
    }
    const schedulerConfigured = isHostedSchedulerConfigured();
    const deployment = getHostedServiceReadiness().deployment;
    if (!schedulerConfigured && deployment !== "local") {
      return NextResponse.json(
        { error: "Background discovery is not configured for this deployment." },
        { status: 503 },
      );
    }

    // Check service readiness before claiming the per-account cooldown. A
    // configuration failure must not block a later attempt after the service
    // has been repaired.
    const claimed = await claimHostedDiscoveryRun(ownerId);
    if (!claimed) {
      return NextResponse.json(
        { error: "Discovery just ran for this account. Try again in a few minutes." },
        { status: 429, headers: { "Retry-After": "300" } },
      );
    }

    const run = await createHostedDiscoveryRun(ownerId, {
      trigger: "manual",
      execution: schedulerConfigured ? "qstash" : "inline-local",
    });

    if (schedulerConfigured) {
      try {
        const destination = new URL("/api/hosted/discovery/worker", request.nextUrl.origin).toString();
        const queued = await queueHostedDiscovery({ ownerId, runId: run.id }, destination);
        await setHostedDiscoveryRunMessageId(ownerId, run.id, queued.messageId);
        const record = await getHostedDiscoveryRun(ownerId, run.id);
        return NextResponse.json(
          { run: record ? toHostedDiscoveryRunView(record) : null },
          { status: 202 },
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Discovery could not be queued.";
        await failHostedDiscoveryRun(ownerId, run.id, message);
        return NextResponse.json({ error: "Discovery could not be queued." }, { status: 502 });
      }
    }

    await startHostedDiscoveryRun(ownerId, run.id);
    const { sourceResults, fetched, classified, saved, failures } = await executeHostedDiscovery(ownerId, profile.search);
    await completeHostedDiscoveryRun(ownerId, run.id, {
      sourcesChecked: sourceResults.length,
      providersSucceeded: sourceResults.length - failures.length,
      fetchedCount: fetched.length,
      qualifiedCount: classified.qualified.length,
      verificationCount: classified.verification.length,
      rejectedCount: classified.rejected.length,
      savedCount: saved.length,
      failures,
      sourceResults,
    });
    const record = await getHostedDiscoveryRun(ownerId, run.id);

    return NextResponse.json({
      run: record ? toHostedDiscoveryRunView(record) : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Discovery could not run.";
    const status = message === "Authentication required." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
