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
