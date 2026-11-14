import type { HostedAtsBoard } from "./ats-catalog";

export type RawJob = {
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

export type CareerOpsJob = {
  title?: string;
  url?: string;
  company?: string;
  location?: string;
  description?: string;
  postedAt?: number;
  salary?: { min?: number; max?: number; currency?: string };
};

export function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function plainText(value: unknown, limit = 900) {
  return text(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

export function positiveNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function inferRemoteSignal(location: string, description: string): RawJob["remoteSignal"] {
  const value = `${location} ${description.slice(0, 1_500)}`;
  if (/\b(remote|distributed|work from home)\b/i.test(value)) return "remote";
  if (/\bhybrid\b/i.test(value)) return "hybrid";
  if (/\b(on[- ]?site|in[- ]?office)\b/i.test(value)) return "onsite";
  return "unknown";
}

function inferSponsorshipSignal(description: string): RawJob["sponsorshipSignal"] {
  const value = description.toLowerCase();
  if (!value) return "unknown";
  if (
    /(?:do not|does not|cannot|can't|unable to|will not|won't) (?:offer |provide )?(?:visa |employment )?sponsorship/.test(value)
    || /(?:without|not require|no need for) (?:current or future )?(?:visa |employment )?sponsorship/.test(value)
    || /must (?:be|already be) (?:legally )?authorized to work[^.]{0,100}without sponsorship/.test(value)
  ) return "negative";
  if (
    /(?:visa|employment) sponsorship (?:is |may be )?(?:available|provided|offered)/.test(value)
    || /(?:will|can|may) sponsor (?:an? )?(?:h-?1b|work visa|qualified candidates?)/.test(value)
  ) return "positive";
  return "unknown";
}

export function normalizeCareerOpsJob(
  job: CareerOpsJob,
  board: HostedAtsBoard,
): RawJob | null {
  const title = text(job.title);
  const url = text(job.url);
  if (!title || !url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;

  const description = plainText(job.description, 5_000);
  const location = text(job.location);
  const sourceJobId = parsed.pathname.split("/").filter(Boolean).at(-1);
  return {
    source: board.provider === "greenhouse" ? "Greenhouse" : board.provider === "lever" ? "Lever" : "Ashby",
    sourceJobId: sourceJobId || undefined,
    url: parsed.toString(),
    company: text(job.company) || board.name,
    title,
    location,
    descriptionExcerpt: description,
    postedAt: Number.isFinite(job.postedAt) ? new Date(Number(job.postedAt)) : null,
    remoteSignal: inferRemoteSignal(location, description),
    sponsorshipSignal: inferSponsorshipSignal(description),
    compensationMinimum: positiveNumber(job.salary?.min),
    compensationMaximum: positiveNumber(job.salary?.max),
    sourceMetadata: {
      provider: board.provider,
      board: board.name,
      compensationCurrency: text(job.salary?.currency).toUpperCase() || undefined,
    },
  };
}
