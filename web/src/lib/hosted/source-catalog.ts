import { HOSTED_ATS_CATALOG, type HostedAtsBoard } from "./ats-catalog";

export type HostedSourceCatalogItem = {
  key: string;
  name: string;
  kind: "job-board" | "company-ats";
  provider: string;
  description: string;
  coverage: string;
  defaultEnabled: boolean;
};

export type HostedPublicFeed = HostedSourceCatalogItem & {
  kind: "job-board";
  adapter: string;
  entry?: Record<string, unknown>;
};

export type HostedManualSource = {
  key: string;
  name: string;
  kind: "manual-board";
  provider: "Manual search";
  description: string;
  coverage: string;
  url: string;
};

export function atsSourceKey(board: HostedAtsBoard) {
  return `ats:${board.provider}:${board.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

export const PUBLIC_FEEDS: HostedPublicFeed[] = [
  { key: "feed:remotive", name: "Remotive", kind: "job-board", provider: "Public API", adapter: "manual", coverage: "Remote · global", description: "Curated remote roles across functions.", defaultEnabled: true },
  { key: "feed:remoteok", name: "RemoteOK", kind: "job-board", provider: "Public API", adapter: "manual", coverage: "Remote · global", description: "High-volume remote technology and business roles.", defaultEnabled: true },
  { key: "feed:himalayas", name: "Himalayas", kind: "job-board", provider: "Public API", adapter: "manual", coverage: "Remote · global", description: "Remote roles with geographic eligibility signals.", defaultEnabled: true },
  { key: "feed:weworkremotely", name: "We Work Remotely", kind: "job-board", provider: "Public RSS", adapter: "weworkremotely", coverage: "Remote · global", description: "Established remote board spanning engineering, product, sales, and support.", defaultEnabled: true },
  { key: "feed:jobicy", name: "Jobicy", kind: "job-board", provider: "Public API", adapter: "jobicy", coverage: "Remote · global", description: "Remote openings across technical and non-technical professions.", defaultEnabled: true },
  { key: "feed:workingnomads", name: "Working Nomads", kind: "job-board", provider: "Public API", adapter: "workingnomads", coverage: "Remote · global", description: "Remote roles from a broad exposed job feed.", defaultEnabled: true },
  { key: "feed:arbeitnow", name: "Arbeitnow", kind: "job-board", provider: "Public API", adapter: "arbeitnow", coverage: "Europe · remote", description: "European and international roles, including remote work.", defaultEnabled: false, entry: { max_pages: 2 } },
  { key: "feed:builtin", name: "Built In", kind: "job-board", provider: "Public pages", adapter: "builtin", coverage: "United States · tech", description: "Technology-company roles across engineering, data, product, design, sales, and marketing.", defaultEnabled: false, entry: { categories: ["dev-engineering", "data-analytics", "product", "design-ux", "sales", "marketing"], max_pages: 1 } },
  { key: "feed:4dayweek", name: "4 Day Week", kind: "job-board", provider: "Public API", adapter: "4dayweek", coverage: "Reduced-hours · global", description: "Four-day-week and reduced-hours opportunities.", defaultEnabled: false, entry: { max_pages: 2 } },
  { key: "feed:jobspresso", name: "Jobspresso", kind: "job-board", provider: "Public RSS", adapter: "jobspresso", coverage: "Remote · global", description: "Remote technology, marketing, customer success, and operations roles.", defaultEnabled: false },
  { key: "feed:nodesk", name: "NoDesk", kind: "job-board", provider: "Public RSS", adapter: "nodesk", coverage: "Remote · global", description: "Remote-first openings across multiple disciplines.", defaultEnabled: false },
  { key: "feed:startup-jobs", name: "Startup Jobs", kind: "job-board", provider: "Public RSS", adapter: "startup-jobs", coverage: "Startups · global", description: "Recent startup and scale-up openings.", defaultEnabled: false },
  { key: "feed:pythonorg", name: "Python.org Jobs", kind: "job-board", provider: "Public RSS", adapter: "pythonorg", coverage: "Python · global", description: "Python-focused engineering, data, and platform roles.", defaultEnabled: false },
  { key: "feed:agentic-jobs", name: "Agentic Engineering Jobs", kind: "job-board", provider: "Public API", adapter: "agentic-jobs", coverage: "AI agents · global", description: "Specialized agentic AI and infrastructure roles.", defaultEnabled: false },
  { key: "feed:landingjobs", name: "Landing.Jobs", kind: "job-board", provider: "Public API", adapter: "landingjobs", coverage: "Europe · tech", description: "European technology roles with remote and relocation signals.", defaultEnabled: false },
  { key: "feed:getonbrd", name: "Get on Board", kind: "job-board", provider: "Public API", adapter: "getonbrd", coverage: "Latin America · tech", description: "Technology opportunities across Latin America and remote teams.", defaultEnabled: false, entry: { max_pages: 2 } },
  { key: "feed:thehub", name: "The Hub", kind: "job-board", provider: "Public API", adapter: "thehub", coverage: "Nordics & Europe · startups", description: "Startup opportunities from Nordic and European companies.", defaultEnabled: false, entry: { max_pages: 2 } },
  { key: "feed:manfred", name: "getManfred", kind: "job-board", provider: "Public API", adapter: "manfred", coverage: "Spain & Europe · tech", description: "English-language European technology openings.", defaultEnabled: false },
];

/**
 * Search portals that do not have a public, contract-safe adapter in this
 * deployment. They are deliberately links, not source toggles: RoleLinked
 * never pretends a portal is being scanned and never asks for the user's
 * portal credentials.
 */
export const MANUAL_SOURCE_DIRECTORY: HostedManualSource[] = [
  { key: "manual:glassdoor", name: "Glassdoor", kind: "manual-board", provider: "Manual search", coverage: "Global", description: "Open Glassdoor search yourself; RoleLinked does not scrape sessions or credentials.", url: "https://www.glassdoor.com/Job/index.htm" },
  { key: "manual:wellfound", name: "Wellfound", kind: "manual-board", provider: "Manual search", coverage: "Global · startups", description: "Browse startup roles directly, then add a promising listing to RoleLinked.", url: "https://wellfound.com/jobs" },
  { key: "manual:naukri", name: "Naukri", kind: "manual-board", provider: "Manual search", coverage: "India", description: "Search one of India’s broad job marketplaces without sharing account credentials.", url: "https://www.naukri.com/" },
  { key: "manual:foundit", name: "foundit", kind: "manual-board", provider: "Manual search", coverage: "India & APAC", description: "Browse India and Asia-Pacific roles directly on foundit.", url: "https://www.foundit.in/" },
  { key: "manual:instahyre", name: "Instahyre", kind: "manual-board", provider: "Manual search", coverage: "India · tech", description: "Open a technology-focused India search and save only the roles you choose.", url: "https://www.instahyre.com/" },
  { key: "manual:cutshort", name: "Cutshort", kind: "manual-board", provider: "Manual search", coverage: "India · tech & startups", description: "Browse Indian technology and startup roles directly.", url: "https://cutshort.io/" },
  { key: "manual:hirist", name: "Hirist", kind: "manual-board", provider: "Manual search", coverage: "India · tech", description: "Search India-focused software, data, and infrastructure roles.", url: "https://www.hirist.tech/" },
  { key: "manual:indeed-india", name: "Indeed India", kind: "manual-board", provider: "Manual search", coverage: "India", description: "Run a broad India search directly on Indeed without automated session access.", url: "https://in.indeed.com/" },
];

export const HOSTED_SOURCE_CATALOG: HostedSourceCatalogItem[] = [
  ...PUBLIC_FEEDS,
  ...HOSTED_ATS_CATALOG.map((board) => ({
    key: atsSourceKey(board),
    name: board.name,
    kind: "company-ats" as const,
    provider: board.provider,
    description: `Direct public ${board.provider} career feed.`,
    coverage: board.coverage ? `${board.coverage} · company career site` : "Company career site",
    defaultEnabled: true,
  })),
];
