import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const here = path.dirname(fileURLToPath(import.meta.url));
const worker = readFileSync(path.join(here, "../../src/app/api/hosted/discovery/worker/route.ts"), "utf8");
const queue = readFileSync(path.join(here, "../../src/lib/hosted/qstash-discovery.ts"), "utf8");
const runRoute = readFileSync(path.join(here, "../../src/app/api/hosted/discovery/run/route.ts"), "utf8");

test("discovery worker verifies the QStash signature against the public URL and delivery region", () => {
  assert.match(worker, /Receiver/);
  assert.match(worker, /x-forwarded-host/);
  assert.match(worker, /x-forwarded-proto/);
  assert.match(worker, /url: publicRequestUrl\(request\)/);
  assert.doesNotMatch(worker, /url: request\.url/);
  assert.match(worker, /upstash-region/);
  assert.match(worker, /upstashRegion: upstashRegion \?\? undefined/);
  assert.match(worker, /upstash-signature/);
});

test("discovery worker logs only a safe verification category", () => {
  assert.match(worker, /signatureFailureCategory/);
  assert.match(worker, /QStash delivery verification failed/);
  assert.match(worker, /upstashRegion:/);
  assert.match(worker, /publicHost:/);
  assert.doesNotMatch(worker, /console\.error\([^\n]*signature,/);
  assert.doesNotMatch(worker, /console\.error\([^\n]*body,/);
});

test("queue payload contains only the tenant and opaque run identifiers", () => {
  assert.match(queue, /HostedDiscoveryMessage = \{ ownerId: string; runId: string \}/);
  assert.doesNotMatch(queue, /resume|description|profile/i);
});

test("QStash publish uses deduplication, bounded retries, and per-tenant flow control", () => {
  assert.match(queue, /deduplicationId:/);
  assert.match(queue, /retries: 3/);
  assert.match(queue, /parallelism: 1/);
  assert.match(queue, /rate: 1/);
});

test("hosted discovery fails closed without QStash while local development keeps an inline path", () => {
  assert.match(runRoute, /!schedulerConfigured && deployment !== "local"/);
  assert.match(runRoute, /execution: schedulerConfigured \? "qstash" : "inline-local"/);
});

test("hosted discovery queues to the immutable Vercel deployment URL", () => {
  assert.match(runRoute, /process\.env\.VERCEL_URL/);
  assert.match(runRoute, /deployment !== "local"/);
  assert.match(runRoute, /hostedDiscoveryWorkerDestination\(request, deployment\)/);
  assert.doesNotMatch(runRoute, /const destination = new URL\("\/api\/hosted\/discovery\/worker", request\.nextUrl\.origin\)/);
});
