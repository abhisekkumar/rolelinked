import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const here = path.dirname(fileURLToPath(import.meta.url));
const migration = readFileSync(path.join(here, "../../drizzle/0006_mushy_thor_girl.sql"), "utf8");

for (const table of [
  "hosted_application_packets",
  "hosted_application_packet_events",
  "hosted_automation_schedules",
  "hosted_source_preferences",
]) {
  test(`${table} has forced tenant row-level security`, () => {
    assert.match(migration, new RegExp(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`));
    assert.match(migration, new RegExp(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`));
    assert.match(migration, new RegExp(`CREATE POLICY "${table}_tenant_isolation"`));
  });
}

test("application packets use owner-aware job and resume references", () => {
  assert.match(migration, /FOREIGN KEY \("job_id","owner_id"\).*REFERENCES "public"\."hosted_jobs"\("id","owner_id"\)/);
  assert.match(migration, /FOREIGN KEY \("resume_id","owner_id"\).*REFERENCES "public"\."resumes"\("id","owner_id"\)/);
});

test("packet events cannot reference another tenant's packet", () => {
  assert.match(migration, /FOREIGN KEY \("packet_id","owner_id"\).*REFERENCES "public"\."hosted_application_packets"\("id","owner_id"\)/);
  const uniqueIndex = migration.indexOf('CREATE UNIQUE INDEX "hosted_application_packets_id_owner_idx"');
  const foreignKey = migration.indexOf('ADD CONSTRAINT "hosted_application_packet_events_packet_owner_fk"');
  assert.ok(uniqueIndex >= 0 && foreignKey >= 0 && uniqueIndex < foreignKey);
});
