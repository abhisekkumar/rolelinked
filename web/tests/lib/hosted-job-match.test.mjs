import assert from "node:assert/strict";
import test from "node:test";

import {
  assertHostedJobStatus,
  canonicalizeJobUrl,
  rankHostedJobs,
} from "../../src/lib/core/hosted-job-match.mjs";

const profile = {
  targetRoles: ["Senior Data Engineer", "Marketing Manager"],
  prioritySkills: ["Spark", "SQL"],
  excludedRoles: ["Data Analyst"],
  locations: ["New York"],
  remotePreference: "remote",
  compensationCurrency: "USD",
  compensationMinimum: 180000,
  sponsorshipRequired: true,
};

test("hosted discovery supports arbitrary professions and removes tracking parameters", () => {
  const jobs = rankHostedJobs([
    {
      source: "test",
      url: "https://example.com/jobs/marketing-manager?utm_source=feed&role=42#apply",
      company: "Example",
      title: "Product Marketing Manager",
      location: "Remote",
      remoteSignal: "remote",
      postedAt: new Date().toISOString(),
    },
  ], profile);
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].canonicalUrl, "https://example.com/jobs/marketing-manager?role=42");
  assert.match(jobs[0].matchReasons.join(" "), /Marketing Manager/);
});

test("hosted discovery ranks relevant roles, deduplicates URLs, and excludes unwanted titles", () => {
  const jobs = rankHostedJobs([
    { source: "a", url: "https://example.com/1", company: "A", title: "Senior Data Engineer", location: "Remote", descriptionExcerpt: "Spark and SQL", remoteSignal: "remote" },
    { source: "b", url: "https://example.com/1?utm_medium=x", company: "A", title: "Senior Data Engineer", location: "Remote", remoteSignal: "remote" },
    { source: "a", url: "https://example.com/2", company: "B", title: "Data Analyst", location: "Remote", remoteSignal: "remote" },
  ], profile);
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].matchedSkills.length, 2);
  assert.ok(jobs[0].matchScore >= 80);
});

test("pipeline status validation allows direct applied tracking but rejects unknown states", () => {
  assert.equal(assertHostedJobStatus("applied"), "applied");
  assert.throws(() => assertHostedJobStatus("auto-submitted"), /Unsupported pipeline status/);
});

test("canonical URLs refuse unsafe protocols", () => {
  assert.throws(() => canonicalizeJobUrl("javascript:alert(1)"), /HTTP or HTTPS/);
});

test("explicit compensation and sponsorship conflicts are filtered without treating silence as rejection", () => {
  const jobs = rankHostedJobs([
    { source: "a", url: "https://example.com/under-floor", company: "A", title: "Senior Data Engineer", location: "Remote", remoteSignal: "remote", compensationMaximum: 150000 },
    { source: "a", url: "https://example.com/no-sponsor", company: "B", title: "Senior Data Engineer", location: "Remote", remoteSignal: "remote", sponsorshipSignal: "negative" },
    { source: "a", url: "https://example.com/unknown", company: "C", title: "Senior Data Engineer", location: "Remote", remoteSignal: "remote", sponsorshipSignal: "unknown" },
    { source: "a", url: "https://example.com/aligned", company: "D", title: "Senior Data Engineer", location: "Remote", remoteSignal: "remote", sponsorshipSignal: "positive", compensationMinimum: 190000 },
  ], profile);
  assert.deepEqual(jobs.map((job) => job.company).sort(), ["C", "D"]);
  assert.match(jobs.find((job) => job.company === "D").matchReasons.join(" "), /compensation floor/);
  assert.match(jobs.find((job) => job.company === "D").matchReasons.join(" "), /Sponsorship signal/);
});

test("canonical URLs preserve identity-bearing single-page job fragments", () => {
  assert.equal(
    canonicalizeJobUrl("https://jobs.example.com/#/jobs/role-42?utm_source=feed"),
    "https://jobs.example.com/?_career_ops_fragment_job_id=role-42",
  );
});
