import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { register } from "node:module";
import test from "node:test";

const hostedRoot = new URL("../../src/lib/hosted/", import.meta.url);
const loader = `
  import { existsSync } from "node:fs";
  import { fileURLToPath, pathToFileURL } from "node:url";
  export async function resolve(specifier, context, nextResolve) {
    if (specifier === "server-only")
      return { url: "data:text/javascript,export%20default%20undefined", shortCircuit: true };
    if (specifier.startsWith("./") && context.parentURL?.startsWith(${JSON.stringify(hostedRoot.href)})) {
      const base = fileURLToPath(new URL(specifier, context.parentURL));
      if (!/\\.[cm]?[jt]sx?$/.test(base) && existsSync(base + ".ts"))
        return { url: pathToFileURL(base + ".ts").href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  }
`;
register(`data:text/javascript,${encodeURIComponent(loader)}`, hostedRoot);
assert.equal(existsSync(new URL("ats-catalog.ts", hostedRoot)), true);

const { HOSTED_SOURCE_CATALOG, MANUAL_SOURCE_DIRECTORY, PUBLIC_FEEDS } = await import("../../src/lib/hosted/source-catalog.ts");
const { normalizeCareerOpsJob } = await import("../../src/lib/hosted/source-normalize.ts");

test("hosted discovery exposes the broad public board catalog", () => {
  assert.ok(PUBLIC_FEEDS.length >= 18);
  for (const required of ["Built In", "We Work Remotely", "Jobicy", "Working Nomads", "Startup Jobs"])
    assert.ok(PUBLIC_FEEDS.some((source) => source.name === required), `${required} is missing`);
});

test("catalog keys are unique and every source explains its coverage", () => {
  assert.equal(new Set(HOSTED_SOURCE_CATALOG.map((source) => source.key)).size, HOSTED_SOURCE_CATALOG.length);
  for (const source of HOSTED_SOURCE_CATALOG) {
    assert.ok(source.description.trim(), `${source.name} needs a description`);
    assert.ok(source.coverage.trim(), `${source.name} needs coverage`);
  }
});

test("expensive specialty boards are opt-in while the core remote feeds start enabled", () => {
  assert.equal(PUBLIC_FEEDS.find((source) => source.name === "Remotive")?.defaultEnabled, true);
  assert.equal(PUBLIC_FEEDS.find((source) => source.name === "We Work Remotely")?.defaultEnabled, true);
  assert.equal(PUBLIC_FEEDS.find((source) => source.name === "Built In")?.defaultEnabled, false);
  assert.equal(PUBLIC_FEEDS.find((source) => source.name === "Agentic Engineering Jobs")?.defaultEnabled, false);
});

test("the public catalog does not claim a LinkedIn integration", () => {
  assert.equal(HOSTED_SOURCE_CATALOG.some((source) => /linkedin/i.test(source.name)), false);
});

test("hosted company sources span five public ATS providers", () => {
  const ats = HOSTED_SOURCE_CATALOG.filter((source) => source.kind === "company-ats");
  assert.ok(ats.length >= 17);
  assert.deepEqual(new Set(ats.map((source) => source.provider)), new Set(["greenhouse", "lever", "ashby", "workable", "icims"]));
  for (const required of ["Hugging Face", "Toggl", "Doist", "Semios", "Nortal"])
    assert.ok(ats.some((source) => source.name === required), `${required} is missing`);
});

test("India coverage is explicit across automated company feeds and manual portals", () => {
  const indiaFeeds = HOSTED_SOURCE_CATALOG.filter((source) => /india/i.test(source.coverage));
  assert.ok(indiaFeeds.length >= 7);
  for (const required of ["HackerRank", "DoorDash India", "AlphaSense India", "Acceldata"])
    assert.ok(indiaFeeds.some((source) => source.name === required), `${required} India feed is missing`);

  const indiaPortals = MANUAL_SOURCE_DIRECTORY.filter((source) => /india/i.test(source.coverage));
  for (const required of ["Naukri", "foundit", "Instahyre", "Cutshort", "Hirist", "Indeed India"])
    assert.ok(indiaPortals.some((source) => source.name === required), `${required} manual portal is missing`);
});

test("credentialed or unsupported portals are honest manual links, never fake scan toggles", () => {
  for (const required of ["Glassdoor", "Wellfound"])
    assert.ok(MANUAL_SOURCE_DIRECTORY.some((source) => source.name === required), `${required} directory link is missing`);
  assert.equal(HOSTED_SOURCE_CATALOG.some((source) => /glassdoor|naukri|instahyre|cutshort/i.test(source.name)), false);
  for (const source of MANUAL_SOURCE_DIRECTORY) {
    assert.equal(source.kind, "manual-board");
    assert.doesNotThrow(() => new URL(source.url));
  }
});

test("new ATS providers retain their provider label on normalized jobs", () => {
  const job = { title: "Data Engineer", url: "https://example.com/jobs/1", company: "Example" };
  assert.equal(normalizeCareerOpsJob(job, { name: "Example", provider: "workable" })?.source, "Workable");
  assert.equal(normalizeCareerOpsJob(job, { name: "Example", provider: "icims" })?.source, "iCIMS");
});
