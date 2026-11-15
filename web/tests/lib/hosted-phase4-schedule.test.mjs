import assert from "node:assert/strict";
import test from "node:test";

import { hostedScheduleCron, hostedScheduleId } from "../../src/lib/hosted/qstash-schedule-core.ts";

test("builds DST-aware daily and twice-daily schedules", () => {
  assert.equal(hostedScheduleCron("daily", "09:30", "America/New_York"), "CRON_TZ=America/New_York 30 9 * * *");
  assert.equal(hostedScheduleCron("twice-daily", "09:30", "America/New_York"), "CRON_TZ=America/New_York 30 9,21 * * *");
});

test("schedule identifiers do not expose the Clerk owner id", () => {
  const id = hostedScheduleId("user_sensitive-identifier");
  assert.match(id, /^rolelinked-discovery-[a-f0-9]{24}$/);
  assert.doesNotMatch(id, /sensitive|identifier/);
});
