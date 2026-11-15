import "server-only";

import { Client } from "@upstash/qstash";
import {
  hostedScheduleCron,
  hostedScheduleId,
  type HostedScheduleCadence,
} from "@/lib/hosted/qstash-schedule-core";

type ScheduleInput = {
  ownerId: string;
  cadence: HostedScheduleCadence;
  localTime: string;
  timezone: string;
  destination: string;
};

function client(env = process.env) {
  const token = String(env.QSTASH_TOKEN || "").trim();
  if (!token) throw new Error("Scheduled discovery is not configured.");
  return new Client({ token });
}

export async function createHostedDiscoverySchedule(input: ScheduleInput) {
  const scheduleId = hostedScheduleId(input.ownerId);
  const protectionBypass = String(process.env.VERCEL_AUTOMATION_BYPASS_SECRET || "").trim();
  const result = await client().schedules.create({
    destination: input.destination,
    scheduleId,
    cron: hostedScheduleCron(input.cadence, input.localTime, input.timezone),
    body: JSON.stringify({ ownerId: input.ownerId }),
    headers: {
      "content-type": "application/json",
      ...(protectionBypass ? { "x-vercel-protection-bypass": protectionBypass } : {}),
    },
    retries: 3,
    label: "rolelinked-scheduled-discovery",
    redact: { body: true },
  });
  return result.scheduleId;
}

export async function deleteHostedDiscoverySchedule(scheduleId: string) {
  await client().schedules.delete(scheduleId);
}
