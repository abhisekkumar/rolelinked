import "server-only";

// The bridge loads the repository's hardened public-ATS providers at runtime.
// Keeping this boundary in plain server JavaScript prevents the web compiler
// from treating the entire CLI provider tree as TypeScript application code.
import { fetchCareerOpsAtsBoard } from "./ats-provider-bridge.mjs";
import { HOSTED_ATS_CATALOG, type HostedAtsBoard } from "./ats-catalog";
import {
  normalizeCareerOpsJob,
  plainText,
  positiveNumber,
  text,
  type CareerOpsJob,
  type RawJob,
} from "./source-normalize";

type SourceResult = { source: string; jobs: RawJob[]; error?: string };

const SOURCES = {
  remotive: "https://remotive.com/api/remote-jobs",
  remoteok: "https://remoteok.com/api",
  himalayas: "https://himalayas.app/jobs/api?limit=100",
} as const;

async function fetchAtsBoard(board: HostedAtsBoard): Promise<SourceResult> {
  const source = `${board.name} · ${board.provider}`;
  try {
    const jobs = await fetchCareerOpsAtsBoard(board) as CareerOpsJob[];
    return {
      source,
      jobs: jobs.flatMap((job) => {
        const normalized = normalizeCareerOpsJob(job, board);
        return normalized ? [normalized] : [];
      }),
    };
  } catch (error) {
    return { source, jobs: [], error: error instanceof Error ? error.message : "Source unavailable" };
  }
}

async function fetchHostedAtsSources(): Promise<SourceResult[]> {
  const fastBoards = HOSTED_ATS_CATALOG.filter((board) => board.provider !== "ashby");
  const slowerAshbyBoards = HOSTED_ATS_CATALOG.filter((board) => board.provider === "ashby");
  const fastPromise = Promise.all(fastBoards.map(fetchAtsBoard));
  // Ashby's public feed has a latency floor and rate-limits bursts to one host.
  // Walk those few boards sequentially while the other ATS requests run in parallel.
  const ashbyPromise = (async () => {
    const results: SourceResult[] = [];
    for (const board of slowerAshbyBoards) results.push(await fetchAtsBoard(board));
    return results;
  })();
  const [fast, ashby] = await Promise.all([fastPromise, ashbyPromise]);
  return [...fast, ...ashby];
}

function validHttpsUrl(value: unknown, trustedHosts: string[]) {
  try {
    const parsed = new URL(text(value));
    const host = parsed.hostname.toLowerCase();
    const trusted = trustedHosts.some((candidate) => host === candidate || host.endsWith(`.${candidate}`));
    return parsed.protocol === "https:" && trusted ? parsed.toString() : "";
  } catch {
    return "";
  }
}

async function fetchJson(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, {
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
      headers: { accept: "application/json", "user-agent": "RoleLinked private job discovery/1.0" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchRemotive(): Promise<RawJob[]> {
  const body = await fetchJson(SOURCES.remotive);
  if (!body || !Array.isArray(body.jobs)) throw new Error("Unexpected response");
  return body.jobs.flatMap((item: Record<string, unknown>) => {
    const url = validHttpsUrl(item.url, ["remotive.com"]);
    const title = text(item.title);
    if (!url || !title) return [];
    const salary = text(item.salary);
    return [{
      source: "Remotive",
      sourceJobId: String(item.id || "") || undefined,
      url,
      company: text(item.company_name) || "Unknown company",
      title,
      location: text(item.candidate_required_location) || "Remote",
      descriptionExcerpt: plainText(item.description),
      postedAt: text(item.publication_date) || null,
      remoteSignal: "remote" as const,
      sponsorshipSignal: "unknown" as const,
      sourceMetadata: { category: text(item.category), salary },
    }];
  });
}

async function fetchRemoteOk(): Promise<RawJob[]> {
  const body = await fetchJson(SOURCES.remoteok);
  if (!Array.isArray(body)) throw new Error("Unexpected response");
  return body.flatMap((item: Record<string, unknown>) => {
    const url = validHttpsUrl(item.url, ["remoteok.com"]);
    const title = text(item.position);
    if (!url || !title) return [];
    return [{
      source: "RemoteOK",
      sourceJobId: String(item.id || "") || undefined,
      url,
      company: text(item.company) || "Unknown company",
      title,
      location: text(item.location) || "Remote",
      descriptionExcerpt: plainText(item.description),
      postedAt: text(item.date) || null,
      remoteSignal: "remote" as const,
      sponsorshipSignal: "unknown" as const,
      compensationMinimum: positiveNumber(item.salary_min),
      compensationMaximum: positiveNumber(item.salary_max),
      sourceMetadata: { tags: Array.isArray(item.tags) ? item.tags.slice(0, 20) : [] },
    }];
  });
}

async function fetchHimalayas(): Promise<RawJob[]> {
  const body = await fetchJson(SOURCES.himalayas);
  if (!body || !Array.isArray(body.jobs)) throw new Error("Unexpected response");
  return body.jobs.flatMap((item: Record<string, unknown>) => {
    const url = validHttpsUrl(item.applicationLink || item.guid, ["himalayas.app"]);
    const title = text(item.title);
    if (!url || !title) return [];
    const restrictions = Array.isArray(item.locationRestrictions)
      ? item.locationRestrictions.map(text).filter(Boolean).join(", ")
      : "Remote";
    const published = typeof item.pubDate === "number"
      ? new Date(item.pubDate < 1_000_000_000_000 ? item.pubDate * 1000 : item.pubDate)
      : text(item.pubDate) || null;
    return [{
      source: "Himalayas",
      sourceJobId: text(item.guid) || undefined,
      url,
      company: text(item.companyName) || "Unknown company",
      title,
      location: restrictions || "Remote",
      descriptionExcerpt: plainText(item.description || item.excerpt),
      postedAt: published,
      remoteSignal: "remote" as const,
      sponsorshipSignal: "unknown" as const,
      sourceMetadata: { categories: Array.isArray(item.categories) ? item.categories.slice(0, 20) : [] },
    }];
  });
}

export async function fetchHostedDiscoverySources(): Promise<SourceResult[]> {
  const runners = [
    ["Remotive", fetchRemotive],
    ["RemoteOK", fetchRemoteOk],
    ["Himalayas", fetchHimalayas],
  ] as const;
  const feedPromise = Promise.all(runners.map(async ([source, run]) => {
    try {
      return { source, jobs: await run() };
    } catch (error) {
      return { source, jobs: [], error: error instanceof Error ? error.message : "Source unavailable" };
    }
  }));
  const [feeds, atsBoards] = await Promise.all([feedPromise, fetchHostedAtsSources()]);
  return [...feeds, ...atsBoards];
}

export type { RawJob, SourceResult };
