import assert from "node:assert/strict";
import test from "node:test";

import { normalizeCareerOpsJob } from "../../src/lib/hosted/source-normalize.ts";

const board = {
  name: "Example Company",
  provider: "ashby",
  careers_url: "https://jobs.ashbyhq.com/example",
};

test("normalizes a shared Career Ops provider job for hosted discovery", () => {
  const normalized = normalizeCareerOpsJob({
    title: "Senior Data Engineer",
    url: "https://jobs.ashbyhq.com/example/role-123",
    company: "Example Company",
    location: "Remote · United States",
    description: "We can sponsor an H-1B for qualified candidates.",
    postedAt: Date.UTC(2026, 10, 8),
    salary: { min: 190_000, max: 230_000, currency: "usd" },
  }, board);

  assert.equal(normalized?.source, "Ashby");
  assert.equal(normalized?.remoteSignal, "remote");
  assert.equal(normalized?.sponsorshipSignal, "positive");
  assert.equal(normalized?.compensationMinimum, 190_000);
  assert.equal(normalized?.sourceMetadata?.board, "Example Company");
});

test("does not convert work-authorization wording into a positive sponsorship claim", () => {
  const normalized = normalizeCareerOpsJob({
    title: "Product Marketing Manager",
    url: "https://jobs.ashbyhq.com/example/role-456",
    location: "New York",
    description: "Candidates must be authorized to work in the United States.",
  }, board);

  assert.equal(normalized?.sponsorshipSignal, "unknown");
});

test("recognizes explicit no-sponsorship wording and rejects non-HTTPS links", () => {
  const negative = normalizeCareerOpsJob({
    title: "Financial Analyst",
    url: "https://jobs.ashbyhq.com/example/role-789",
    description: "We are unable to provide visa sponsorship for this role.",
  }, board);
  const unsafe = normalizeCareerOpsJob({
    title: "Financial Analyst",
    url: "http://jobs.ashbyhq.com/example/role-789",
  }, board);

  assert.equal(negative?.sponsorshipSignal, "negative");
  assert.equal(unsafe, null);
});
