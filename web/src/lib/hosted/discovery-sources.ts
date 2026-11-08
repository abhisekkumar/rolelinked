import "server-only";

type RawJob = {
  source: string;
  sourceJobId?: string;
  url: string;
  company: string;
  title: string;
  location: string;
  descriptionExcerpt?: string;
  postedAt?: string | Date | null;
  remoteSignal?: "remote" | "hybrid" | "onsite" | "unknown";
  sponsorshipSignal?: "positive" | "negative" | "unknown";
  compensationMinimum?: number | null;
  compensationMaximum?: number | null;
  sourceMetadata?: Record<string, unknown>;
};

type SourceResult = { source: string; jobs: RawJob[]; error?: string };

const SOURCES = {
  remotive: "https://remotive.com/api/remote-jobs",
  remoteok: "https://remoteok.com/api",
  himalayas: "https://himalayas.app/jobs/api?limit=100",
} as const;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function plainText(value: unknown, limit = 900) {
  return text(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function positiveNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
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
  return Promise.all(runners.map(async ([source, run]) => {
    try {
      return { source, jobs: await run() };
    } catch (error) {
      return { source, jobs: [], error: error instanceof Error ? error.message : "Source unavailable" };
    }
  }));
}

export type { RawJob, SourceResult };
