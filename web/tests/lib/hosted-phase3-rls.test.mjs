import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const here = path.dirname(fileURLToPath(import.meta.url));
const migration = readFileSync(path.join(here, "../../drizzle/0003_known_mathemanic.sql"), "utf8");

for (const table of ["hosted_jobs", "hosted_job_status_events"]) {
  test(`${table} has forced tenant row-level security`, () => {
    assert.match(migration, new RegExp(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`));
    assert.match(migration, new RegExp(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`));
    assert.match(migration, new RegExp(`CREATE POLICY "${table}_tenant_isolation"`));
  });
}

test("status history cannot reference a job owned by another tenant", () => {
  assert.match(migration, /FOREIGN KEY \("job_id","owner_id"\)/);
  assert.match(migration, /REFERENCES "public"\."hosted_jobs"\("id","owner_id"\)/);
});

test("the composite job identity is unique before the tenant-safe foreign key is added", () => {
  const uniqueIndex = migration.indexOf('CREATE UNIQUE INDEX "hosted_jobs_id_owner_idx"');
  const foreignKey = migration.indexOf('ADD CONSTRAINT "hosted_job_status_events_job_owner_fk"');
  assert.ok(uniqueIndex >= 0);
  assert.ok(foreignKey >= 0);
  assert.ok(uniqueIndex < foreignKey, "Postgres requires the referenced unique index before the foreign key");
});
