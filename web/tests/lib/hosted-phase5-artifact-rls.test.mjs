import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = path.dirname(fileURLToPath(import.meta.url));
const artifacts = readFileSync(path.join(here, "../../drizzle/0008_brave_spitfire.sql"), "utf8");
const packets = readFileSync(path.join(here, "../../drizzle/0009_yellow_reavers.sql"), "utf8");

for (const table of ["hosted_artifacts", "hosted_artifact_versions"]) {
  test(`${table} has forced tenant row-level security`, () => {
    assert.match(artifacts, new RegExp(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`));
    assert.match(artifacts, new RegExp(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`));
    assert.match(artifacts, new RegExp(`CREATE POLICY "${table}_tenant_isolation"`));
  });
}

test("ATS reports have forced tenant isolation", () => {
  assert.match(packets, /ALTER TABLE "hosted_ats_reports" ENABLE ROW LEVEL SECURITY/);
  assert.match(packets, /ALTER TABLE "hosted_ats_reports" FORCE ROW LEVEL SECURITY/);
  assert.match(packets, /CREATE POLICY "hosted_ats_reports_tenant_isolation"/);
});

test("packets pin tenant-owned artifact versions and ATS reports", () => {
  assert.match(packets, /hosted_application_packets_resume_artifact_owner_fk/);
  assert.match(packets, /hosted_application_packets_cover_letter_owner_fk/);
  assert.match(packets, /hosted_application_packets_ats_report_owner_fk/);
});
