import assert from "node:assert/strict";
import test from "node:test";

import { sourceFromUrl } from "../../src/lib/inbox.ts";

const cases = [
  ["https://boards.greenhouse.io/acme/jobs/1", "greenhouse"],
  ["https://jobs.lever.co/acme/1", "lever"],
  ["https://jobs.ashbyhq.com/acme/1", "ashby"],
  ["https://acme.wd5.myworkdayjobs.com/jobs/1", "workday"],
  ["https://www.builtinnyc.com/job/data-engineer/1", "builtin"],
  ["https://remoteok.com/remote-jobs/1", "remoteok"],
  ["https://remotive.com/remote-jobs/1", "remotive"],
  ["https://weworkremotely.com/remote-jobs/1", "weworkremotely"],
  ["https://himalayas.app/companies/acme/jobs/1", "himalayas"],
  ["https://jobicy.com/jobs/1", "jobicy"],
];

test("pipeline source detection covers ATS and additional boards", () => {
  for (const [url, expected] of cases) assert.equal(sourceFromUrl(url), expected, url);
});

test("pipeline source detection anchors matches to a hostname boundary", () => {
  assert.equal(sourceFromUrl("https://builtinnyc.com.evil.example/job/1"), null);
  assert.equal(sourceFromUrl("https://notremoteok.com/job/1"), null);
});
