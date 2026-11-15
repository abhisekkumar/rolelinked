import { NextRequest, NextResponse } from "next/server";

import {
  getHostedAutomationSchedule,
  saveHostedAutomationSchedule,
} from "@/lib/hosted/db/repository";
import { requireHostedUserId } from "@/lib/hosted/identity";
import {
  createHostedDiscoverySchedule,
  deleteHostedDiscoverySchedule,
} from "@/lib/hosted/qstash-schedule";
import { hostedAutomationScheduleSchema } from "@/lib/hosted/profile-schema";

function triggerDestination(request: NextRequest) {
  const appUrl = String(process.env.NEXT_PUBLIC_APP_URL || "").trim();
  const vercelUrl = String(process.env.VERCEL_URL || "").trim();
  const origin = appUrl || (vercelUrl ? `https://${vercelUrl}` : request.nextUrl.origin);
  return new URL("/api/hosted/automation/trigger", origin).toString();
}

export async function GET() {
  try {
    const ownerId = await requireHostedUserId();
    return NextResponse.json({ schedule: await getHostedAutomationSchedule(ownerId) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load automation settings.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const ownerId = await requireHostedUserId();
    const parsed = hostedAutomationScheduleSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid schedule." }, { status: 400 });
    const current = await getHostedAutomationSchedule(ownerId);
    let scheduleId: string | null = current?.qstashScheduleId || null;
    if (parsed.data.enabled) {
      scheduleId = await createHostedDiscoverySchedule({
        ownerId,
        ...parsed.data,
        destination: triggerDestination(request),
      });
    } else if (scheduleId) {
      await deleteHostedDiscoverySchedule(scheduleId);
      scheduleId = null;
    }
    const schedule = await saveHostedAutomationSchedule(ownerId, {
      ...parsed.data,
      qstashScheduleId: scheduleId,
      lastError: null,
    });
    return NextResponse.json({ schedule });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save automation settings.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}
