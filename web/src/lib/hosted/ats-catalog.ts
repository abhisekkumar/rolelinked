import "server-only";

export type HostedAtsProvider =
  | "greenhouse"
  | "lever"
  | "ashby"
  | "workable"
  | "icims";

export type HostedAtsBoard = {
  name: string;
  provider: HostedAtsProvider;
  careers_url: string;
  coverage?: string;
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
  { name: "Reddit", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/reddit" },
  { name: "CoreWeave", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/coreweave" },
  { name: "Glean", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/gleanwork" },
  { name: "Anthropic", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/anthropic" },
  { name: "Intercom", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/intercom" },
  { name: "Hume AI", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/humeai" },
  { name: "Arize AI", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/arizeai" },
  { name: "Databricks", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/databricks" },
  { name: "Dagster Labs", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/dagsterlabs" },
  { name: "Cribl", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/cribl" },
  { name: "Datadog", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/datadog" },
  { name: "Stripe", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/stripe" },
  { name: "Affirm", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/affirm" },
  { name: "Robinhood", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/robinhood" },
  { name: "Fivetran", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/fivetran" },
  { name: "Cockroach Labs", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/cockroachlabs" },
  { name: "Grafana Labs", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/grafanalabs" },
  { name: "Tailscale", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/tailscale" },
  { name: "Sigma Computing", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/sigmacomputing" },
  { name: "Scale AI", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/scaleai" },
  { name: "Brex", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/brex" },
  { name: "Chainguard", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/chainguard" },
  { name: "Mercury", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/mercury" },
  { name: "Palantir", provider: "lever", careers_url: "https://jobs.lever.co/palantir" },
  { name: "Anduril", provider: "lever", careers_url: "https://jobs.lever.co/anduril" },
  { name: "Highspot", provider: "lever", careers_url: "https://jobs.lever.co/highspot" },
  { name: "Supabase", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/supabase" },
  { name: "Cohere", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/cohere" },
  { name: "Deepgram", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/deepgram" },
  { name: "Temporal", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/temporal" },
  { name: "ElevenLabs", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/elevenlabs" },
  { name: "Runpod", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/runpod" },
  { name: "Sierra", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/sierra" },
  { name: "Decagon", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/decagon" },
  { name: "n8n", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/n8n" },
  { name: "LangChain", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/langchain" },
  { name: "Pinecone", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/pinecone" },
  { name: "Perplexity", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/perplexity" },
  { name: "Clay", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/claylabs" },
  { name: "Runway", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/runway" },
  { name: "Hightouch", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/hightouch" },
  { name: "WorkOS", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/workos" },
  { name: "Airbyte", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/airbyte" },
  { name: "Astronomer", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/astronomer" },
  { name: "Monte Carlo", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/montecarlodata" },
  { name: "MotherDuck", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/motherduck" },
  { name: "ClickHouse", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/clickhouse" },
  { name: "Baseten", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/baseten" },
  { name: "Modal", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/modal" },
  { name: "Anyscale", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/anyscale" },
  { name: "Materialize", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/materialize" },
  { name: "Hex", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/hex" },
  { name: "Ramp", provider: "ashby", careers_url: "https://jobs.ashbyhq.com/ramp" },
  { name: "Hugging Face", provider: "workable", careers_url: "https://apply.workable.com/huggingface/" },
  { name: "Toggl", provider: "workable", careers_url: "https://apply.workable.com/toggl" },
  { name: "Doist", provider: "workable", careers_url: "https://apply.workable.com/doist" },
  { name: "Semios", provider: "workable", careers_url: "https://apply.workable.com/semios/" },
  { name: "Nortal", provider: "icims", careers_url: "https://careers-en-nortal.icims.com/jobs/search?ss=1" },
  { name: "HackerRank", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/hackerrank", coverage: "India & United States" },
  { name: "DoorDash India", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/doordashindia", coverage: "India" },
  { name: "AlphaSense India", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/alphasenseindia", coverage: "India" },
  { name: "Black Duck", provider: "greenhouse", careers_url: "https://job-boards.greenhouse.io/blackduck", coverage: "India & global" },
  { name: "Dun & Bradstreet", provider: "lever", careers_url: "https://jobs.lever.co/dnb", coverage: "India & global" },
  { name: "Acceldata", provider: "lever", careers_url: "https://jobs.lever.co/acceldata", coverage: "India" },
  { name: "ION Group", provider: "lever", careers_url: "https://jobs.lever.co/ion", coverage: "India & global" },
];
