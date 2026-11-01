import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const here = path.dirname(fileURLToPath(import.meta.url));
const migration = readFileSync(path.join(here, "../../drizzle/0002_naive_old_lace.sql"), "utf8");

const tenantTables = [
  "users",
  "candidate_profiles",
  "search_profiles",
  "resumes",
  "resume_versions",
  "documents",
  "account_deletion_requests",
];

test("every Phase 2 tenant table has forced row-level security", () => {
  for (const table of tenantTables) {
    assert.match(migration, new RegExp(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`));
    assert.match(migration, new RegExp(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`));
    assert.match(migration, new RegExp(`CREATE POLICY "${table}_tenant_isolation"`));
  }
});

test("resume versions cannot reference a resume owned by a different tenant", () => {
  assert.match(migration, /FOREIGN KEY \("resume_id","owner_id"\)/);
  assert.match(migration, /REFERENCES "public"\."resumes"\("id","owner_id"\)/);
});
