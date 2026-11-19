import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = path.dirname(fileURLToPath(import.meta.url));
const migration = readFileSync(path.join(here, "../../drizzle/0007_melodic_mac_gargan.sql"), "utf8");

for (const table of [
  "hosted_evidence_items",
  "hosted_evidence_events",
  "hosted_evidence_usages",
]) {
  test(`${table} has forced tenant row-level security`, () => {
    assert.match(migration, new RegExp(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`));
    assert.match(migration, new RegExp(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`));
    assert.match(migration, new RegExp(`CREATE POLICY "${table}_tenant_isolation"`));
  });
}

test("evidence sources use owner-aware resume and document references", () => {
  assert.match(migration, /FOREIGN KEY \("source_resume_id","owner_id"\).*REFERENCES "public"\."resumes"\("id","owner_id"\)/);
  assert.match(migration, /FOREIGN KEY \("source_document_id","owner_id"\).*REFERENCES "public"\."documents"\("id","owner_id"\)/);
});

test("events and usages cannot reference another tenant's evidence", () => {
  assert.match(migration, /FOREIGN KEY \("evidence_id","owner_id"\).*REFERENCES "public"\."hosted_evidence_items"\("id","owner_id"\)/);
  const identityIndex = migration.indexOf('CREATE UNIQUE INDEX "hosted_evidence_items_id_owner_idx"');
  const firstDependentForeignKey = migration.indexOf('ADD CONSTRAINT "hosted_evidence_events_item_owner_fk"');
  assert.ok(identityIndex >= 0 && firstDependentForeignKey >= 0 && identityIndex < firstDependentForeignKey);
});

test("database checks reject unsupported provenance states and mismatched source references", () => {
  assert.match(migration, /hosted_evidence_items_verification_state_check/);
  assert.match(migration, /derived-unverified/);
  assert.match(migration, /user-cannot-confirm/);
  assert.match(migration, /hosted_evidence_items_source_reference_check/);
});
