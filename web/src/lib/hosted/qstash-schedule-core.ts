import { createHash } from "node:crypto";

export type HostedScheduleCadence = "daily" | "twice-daily" | "weekly";

export function hostedScheduleId(ownerId: string) {
  const ownerKey = createHash("sha256").update(ownerId).digest("hex").slice(0, 24);
  return `rolelinked-discovery-${ownerKey}`;
}

export function hostedScheduleCron(cadence: HostedScheduleCadence, localTime: string, timezone: string) {
  try { new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(); } catch {
    throw new Error("Choose a valid IANA timezone, such as America/New_York.");
  }
  const [hourText, minuteText] = localTime.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) throw new Error("Choose a valid local time.");
  if (cadence === "twice-daily") {
    return `CRON_TZ=${timezone} ${minute} ${hour},${(hour + 12) % 24} * * *`;
  }
  if (cadence === "weekly") return `CRON_TZ=${timezone} ${minute} ${hour} * * 1`;
  return `CRON_TZ=${timezone} ${minute} ${hour} * * *`;
}
