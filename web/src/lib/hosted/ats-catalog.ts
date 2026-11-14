import "server-only";

export type HostedAtsProvider = "greenhouse" | "lever" | "ashby";

export type HostedAtsBoard = {
  name: string;
  provider: HostedAtsProvider;
  careers_url: string;
};

/**
 * A deliberately small, cross-industry starter catalog. Each public ATS board
 * exposes every department, so the account's search profile—not this list—
 * decides whether engineering, marketing, finance, sales, operations, or
 * another profession reaches the review queue.
 *
 * This remains system-owned seed data. Per-account source selection can be
 * layered on later without changing the provider or matching engines.
 */
export const HOSTED_ATS_CATALOG: HostedAtsBoard[] = [
  { name: "Airtable", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/airtable" },
  { name: "Vercel", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/vercel" },
  { name: "Temporal", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/temporal" },
  { name: "Reddit", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/reddit" },
  { name: "CoreWeave", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/coreweave" },
  { name: "Glean", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/gleanwork" },
  { name: "Palantir", provider: "lever", careers_url: "https://jobs.lever.co/palantir" },
  { name: "Anduril", provider: "lever", careers_url: "https://jobs.lever.co/anduril" },
  { name: "Highspot", provider: "lever", careers_url: "https://jobs.lever.co/highspot" },
  { name: "Supabase", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/supabase" },
  { name: "Cohere", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/cohere" },
  { name: "Deepgram", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/deepgram" },
];
