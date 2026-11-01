# Hosted RoleLinked architecture

This document defines the boundary between the public hosted service at
`rolelinked.com` and the self-hosted/local edition. The goal is one recognizable
product with two safe execution models, not a shared server pretending to be a
personal laptop.

## Product promise

- A new user can create a Clerk account and begin without installing a CLI.
- Every account has its own profile, resumes, searches, jobs, applications,
  documents, schedules, interview prep, and AI history.
- Discovery and preparation can run unattended. Applying, submitting forms,
  changing an externally observed status, and sending messages always require
  explicit user approval.
- Hosted launch features are free. Rate, concurrency, and abuse safeguards protect
  service availability and cost; they are not feature paywalls.
- Self-hosted/local mode remains available for unrestricted use with the user's
  own computer and provider accounts.

## Recommended hosted stack

| Concern | Initial choice | Why |
|---|---|---|
| Web application | Existing Next.js app on Vercel | Lowest-friction path from the current App Router codebase and custom domain |
| Identity | Clerk | Existing user choice, mature Next.js integration, account/session management |
| Relational data | Neon Postgres through the Vercel Marketplace | Strong tenant keys, transactions, reporting, portable SQL, and serverless connectivity |
| Private files | Vercel Private Blob | Authenticated resume, PDF, and export storage outside Git and database rows |
| Background execution | Inngest durable functions | Retries, concurrency limits, idempotency, waits, and observable multi-step scans |
| Schedule trigger | Durable per-user schedule plus one reconciliation tick | Preserves each user's timezone and cadence without creating one Vercel Cron entry per user |
| AI | Server-side model gateway | Keys never reach browsers; supports budgets, audit logs, fallbacks, and future provider changes |
| Observability | Structured logs plus error tracing | Diagnoses provider failures without logging resume text or credentials |

Vercel Cron alone is not the per-user scheduler. Cron definitions are deployment
configuration, are capped per project, run in UTC, and have lower timing
precision on the Hobby plan. Inngest should hold each user's next scheduled run;
a single secured Vercel Cron reconciliation endpoint can recover schedules that
were interrupted or missed. The dispatcher leases due rows transactionally and
enqueues idempotent jobs. This avoids duplicate runs, survives deployments, and
lets users choose their own timezone and cadence.

## Tenant boundary

Every hosted record has an immutable `owner_id` derived from the authenticated
Clerk user ID. Every read and write must enforce that owner on the server; a
browser-supplied owner ID is never trusted.

Minimum hosted entities:

- `users` — Clerk ID, timezone, onboarding state, service preferences;
- `candidate_profiles` — source-backed career facts and targeting preferences;
- `resumes` and `resume_versions` — multiple role-specific source documents;
- `search_profiles` — titles, technologies, locations, compensation, work authorization;
- `job_postings` — normalized public listings and source provenance;
- `job_matches` — user-specific score, evidence, verification state, and disposition;
- `applications` and `application_events` — tracker state plus append-only history;
- `documents` — metadata for private object-storage files;
- `schedules` and `job_runs` — timezone-aware cadence, leases, retries, and outcomes;
- `assistant_threads` and `assistant_messages` — tenant-scoped Ask history;
- `approvals` — immutable record of the user action that authorized an external effect;
- `usage_events` — model/provider cost, rate-limit, and abuse-control accounting.

Database policies should enforce `owner_id` in addition to application checks.
Object keys must be namespaced by owner and accessed through short-lived signed
URLs. Deleting an account must enqueue deletion of both database rows and files.

## Execution boundaries

### Local edition

- Resolves the user data root from local environment/marker files.
- May invoke installed Claude Code, Codex, Playwright, and local LaTeX tools.
- Uses local files and optional user-owned provider credentials.
- Requires no RoleLinked account.

### Hosted edition

- Never reads a repository-level `cv.md`, `data/`, `reports/`, or local data root.
- Never starts arbitrary shell commands or user-supplied CLI binaries.
- Uses authenticated repositories and object storage scoped to the current user.
- Runs only allow-listed discovery, parsing, document, and AI worker operations.
- Treats all job listings, company pages, form fields, and messages as untrusted data.

## AI and the free launch

The hosted Ask experience uses RoleLinked-managed server credentials. It needs:

- daily and burst request limits;
- bounded input/output tokens and attachment sizes;
- per-user and global concurrency limits;
- provider timeouts, retries, and circuit breakers;
- model routing with a low-cost default and explicit high-cost escalation;
- redacted logs that record cost and status, not private prompt bodies;
- an emergency kill switch and wait queue.

The UI may say “Free to start — fair-use limits apply.” It should not promise
unlimited hosted model consumption. Local mode can remain unrestricted because
the user supplies the compute and/or model account.

## How login unlocks the local feature set

Clerk authentication is the front door, not the implementation of the product.
After sign-in, `/app` resolves the authenticated Clerk `user_id` and constructs
a tenant-scoped service context. The existing dashboard components then call
the same domain operations through hosted adapters instead of local files and
shell commands.

| Local capability | Hosted implementation after login |
|---|---|
| `config/profile.yml` and `modes/_profile.md` | `candidate_profiles` and `search_profiles` rows owned by the Clerk user |
| `cv.md`, LaTeX sources, and generated PDFs | versioned `resumes` metadata in Postgres plus encrypted private Blob objects |
| `data/pipeline.md` and `data/applications.md` | `job_matches`, `applications`, and append-only `application_events` |
| `scan.mjs` and provider modules | allow-listed Inngest discovery jobs writing normalized public postings and private user matches |
| CLI-driven evaluation and tailoring | server-side `ModelGateway` jobs with source-bound prompts, budgets, and audit metadata |
| local scheduled-job JSON | `schedules` and `job_runs` with durable next-run execution and reconciliation |
| `documents/`, `reports/`, and `interview-prep/` | tenant-scoped document records and private generated artifacts |
| local Ask conversations | `assistant_threads` and `assistant_messages`, always filtered by authenticated owner |
| browser-assisted apply | review packet first; any future external action requires a fresh exact-payload approval |

The UI should not contain two independent implementations. Domain services own
the behavior; adapters own the environment:

```text
Dashboard UI
    ↓
Authenticated route/server action
    ↓
RoleLinked domain service
    ├── Local adapters: files + approved installed tools
    └── Hosted adapters: Clerk + Postgres + Private Blob + Inngest + ModelGateway
```

This is the main engineering migration: extract filesystem and process access
out of route handlers, place it behind the portability interfaces below, and
implement tenant-safe hosted adapters one workflow at a time. A user should see
the same concepts and statuses in both editions even though execution differs.

### Recommended first authenticated slice

The first production slice should prove the boundary end to end before exposing
every dashboard page:

1. Clerk sign-up/sign-in and protected `/app` route;
2. tenant profile and search preferences in Postgres;
3. multiple private resume uploads with version metadata;
4. manual discovery run through an Inngest function;
5. user-specific match inbox and application tracker;
6. cross-account denial tests for every read, write, and file download;
7. account export and deletion.

Once that slice is reliable, add tailoring, interview preparation, Ask,
user-defined schedules, and approval-gated integrations in that order.

## Job discovery policy

Hosted discovery may use public employer ATS feeds, public job-board APIs, and
providers whose terms permit automated access. It must not scrape signed-in
LinkedIn sessions or collect account cookies. LinkedIn support should use a
private user export, user-pasted links, or a future approved partner API.

## Approval invariant

Workers may discover, evaluate, draft, render, and propose. An external side
effect requires a fresh approval record tied to the exact action payload. A
scheduled scan never grants permission to submit an application or send a
message. Approval records expire and cannot authorize a materially changed
payload.

## Portability interfaces

Hosted code should depend on these interfaces rather than vendors directly:

1. `IdentityProvider` — current user and authorization context;
2. `CareerRepository` — tenant-scoped structured records;
3. `PrivateObjectStore` — resumes and generated artifacts;
4. `JobQueue` — durable background execution;
5. `ScheduleRepository` — due-work leases and run history;
6. `ModelGateway` — policy-aware LLM calls and usage accounting;
7. `ApprovalService` — review, authorization, expiry, and audit trail.

This keeps Clerk, Vercel, PostgreSQL, storage, and the first model provider
replaceable as the service grows.

## Delivery phases

1. **Public repository and staging:** publish the verified local baseline, add
   CI, create a private staging deployment, and configure `staging.rolelinked.com`.
2. **Identity and tenant data:** Clerk, user profile, PostgreSQL schema, object
   storage, account deletion, and authorization tests.
3. **Hosted discovery:** search profiles, manual scan, normalized matches,
   idempotent workers, source health, and a safe per-user pipeline.
4. **Schedules:** timezone-aware UI, system dispatcher, leases, retries,
   notifications, pause/resume, and run history.
5. **Hosted Ask and documents:** model gateway, fair-use controls, source-backed
   answers, multiple resumes, versioned tailoring, and downloadable artifacts.
6. **Approval workflows:** exact-payload review and auditable gates for any
   future browser or messaging integration.
7. **Production launch:** security review, backups/restore test, privacy/terms,
   abuse response, monitoring, cost caps, and `rolelinked.com` DNS cutover.

The production domain is the last step, not the first. A staging deployment must
prove tenant isolation, deletion, scheduling, and cost controls before real
candidate data is accepted.

## Platform references

- [Clerk App Router authentication and protected routes](https://clerk.com/docs/reference/nextjs/app-router/auth)
- [Clerk webhook delivery and idempotency guidance](https://clerk.com/docs/guides/development/webhooks/overview)
- [Postgres integrations on Vercel](https://vercel.com/docs/postgres)
- [Vercel Private Blob storage](https://vercel.com/docs/vercel-blob/private-storage)
- [Vercel Cron limits and timing](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- [Inngest schedules and delayed starts](https://www.inngest.com/docs/durable-execution/guides-and-advanced/events-and-triggers/schedules-and-delayed-starts)
- [Inngest Next.js integration](https://www.inngest.com/docs/getting-started/nextjs-quick-start)
