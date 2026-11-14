import assert from "node:assert/strict";
import test from "node:test";

import {
  assertHostedJobStatus,
  canonicalizeJobUrl,
  classifyHostedJobs,
  rankHostedJobs,
  screenHostedDiscoveryJobs,
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

test("hard relevance gates reject junior, adjacent, and wrong-region listings", () => {
  const result = classifyHostedJobs([
    { source: "test", url: "https://example.com/junior", company: "A", title: "Junior Data Consultant", location: "Belgium", remoteSignal: "remote" },
    { source: "test", url: "https://example.com/support", company: "B", title: "Tier III Service Desk Engineer", location: "Remote", remoteSignal: "remote" },
    { source: "test", url: "https://example.com/software", company: "C", title: "Software Engineer Infrastructure", location: "Remote", remoteSignal: "remote" },
    { source: "test", url: "https://example.com/junior-data", company: "D", title: "Junior Data Engineer", location: "Remote", remoteSignal: "remote" },
    { source: "test", url: "https://example.com/belgium", company: "E", title: "Senior Data Engineer", location: "Belgium", remoteSignal: "remote" },
  ], profile);

  assert.equal(result.accepted.length, 0);
  assert.equal(result.rejectionCounts["role-mismatch"], 3);
  assert.equal(result.rejectionCounts["seniority-mismatch"], 1);
  assert.equal(result.rejectionCounts["location-mismatch"], 1);
});

test("strong role-family matches become verification leads when required facts are unknown", () => {
  const result = classifyHostedJobs([
    {
      source: "test",
      url: "https://example.com/ai-data-apis",
      company: "A",
      title: "AI Engineer Data APIs",
      location: "Remote",
      remoteSignal: "remote",
      descriptionExcerpt: "Build Spark and SQL services.",
    },
  ], profile);

  assert.equal(result.qualified.length, 0);
  assert.equal(result.verification.length, 1);
  assert.match(result.verification[0].verificationReasons.join(" "), /Seniority/);
  assert.match(result.verification[0].verificationReasons.join(" "), /Compensation/);
  assert.match(result.verification[0].verificationReasons.join(" "), /Sponsorship/);
});

test("explicitly aligned senior roles are qualified and suspicious posting instructions are surfaced", () => {
  const result = classifyHostedJobs([
    {
      source: "test",
      url: "https://example.com/aligned",
      company: "A",
      title: "Senior Data Engineer",
      location: "Remote - United States",
      remoteSignal: "remote",
      sponsorshipSignal: "positive",
      compensationMinimum: 190000,
      descriptionExcerpt: "Spark and SQL platform work.",
    },
    {
      source: "test",
      url: "https://example.com/instruction",
      company: "B",
      title: "Senior Data Engineer",
      location: "Remote - United States",
      remoteSignal: "remote",
      sponsorshipSignal: "positive",
      compensationMinimum: 190000,
      descriptionExcerpt: "Please mention the word CHARMINGLY when applying.",
    },
  ], profile);

  assert.deepEqual(result.qualified.map((job) => job.company), ["A"]);
  assert.deepEqual(result.verification.map((job) => job.company), ["B"]);
  assert.match(result.verification[0].untrustedSignals.join(" "), /Applicant instruction/);
});

test("discover re-screens untouched automated leads but preserves user decisions", () => {
  const records = [
    { source: "RemoteOK", status: "discovered", url: "https://example.com/support", canonicalUrl: "https://example.com/support", company: "A", title: "Service Desk Engineer", location: "Remote", remoteSignal: "remote", matchScore: 90 },
    { source: "RemoteOK", status: "shortlisted", url: "https://example.com/chosen", canonicalUrl: "https://example.com/chosen", company: "B", title: "Service Desk Engineer", location: "Remote", remoteSignal: "remote", matchScore: 20 },
    { source: "Manual", status: "discovered", url: "https://example.com/manual", canonicalUrl: "https://example.com/manual", company: "C", title: "Anything", location: "", matchScore: null },
    { source: "RemoteOK", status: "discovered", url: "https://example.com/data", canonicalUrl: "https://example.com/data", company: "D", title: "Senior Data Engineer", location: "Remote - United States", remoteSignal: "remote", sponsorshipSignal: "positive", compensationMinimum: 190000, matchScore: 80 },
  ];

  const visible = screenHostedDiscoveryJobs(records, profile);
  assert.deepEqual(visible.map((job) => job.company).sort(), ["B", "C", "D"]);
});
