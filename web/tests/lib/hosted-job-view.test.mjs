import assert from "node:assert/strict";
import test from "node:test";

import { toHostedJobView } from "../../src/lib/hosted/job-view.ts";

test("hosted job responses exclude tenant and provider-internal fields", () => {
  const now = new Date("2026-11-08T12:00:00.000Z");
  const view = toHostedJobView({
    id: "b07b1723-227d-473c-a70a-ea9ded38c505",
    ownerId: "user_private",
    source: "Example",
    sourceJobId: "provider-id",
    url: "https://example.com/jobs/1",
    canonicalUrl: "https://example.com/jobs/1",
    company: "Example",
    title: "Marketing Manager",
    location: "Remote",
    descriptionExcerpt: "A role",
    postedAt: now,
    discoveredAt: now,
    matchScore: 88,
    matchReasons: ["Matches Marketing Manager"],
    matchedSkills: ["Go-to-market"],
    remoteSignal: "remote",
    sponsorshipSignal: "unknown",
    compensationMinimum: 120000,
    compensationMaximum: 150000,
    status: "discovered",
    statusUpdatedAt: now,
    sourceMetadata: { providerSecret: "not-for-browser" },
    createdAt: now,
    updatedAt: now,
  });

  assert.equal(view.company, "Example");
  assert.equal(view.postedAt, now.toISOString());
  assert.equal("ownerId" in view, false);
  assert.equal("canonicalUrl" in view, false);
  assert.equal("sourceJobId" in view, false);
  assert.equal("sourceMetadata" in view, false);
  assert.equal("createdAt" in view, false);
  assert.equal("updatedAt" in view, false);
});
