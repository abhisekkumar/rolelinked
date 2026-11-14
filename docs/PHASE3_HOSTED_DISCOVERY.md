# Phase 3: hosted discovery and pipeline

Phase 3 makes discovery and pipeline tracking durable for each authenticated RoleLinked account.

## What is live

- Public ATS and remote-job sources are normalized into account-private job records.
- Discovery runs in a signed QStash background worker in hosted environments.
- Each run records counts and per-source health without storing resumes or private profile content in the queue.
- QStash retries reuse the same discovery run, and job writes remain idempotent by account and canonical URL.
- Pipeline stage changes update RoleLinked only. They never submit an application or contact a company.
- Discovery runs, source checks, jobs, and status history use forced Postgres row-level security.

## Required hosted environment variables

Configure these in Vercel for Preview and Production:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `QSTASH_TOKEN`
- `QSTASH_CURRENT_SIGNING_KEY`
- `QSTASH_NEXT_SIGNING_KEY`
- Clerk variables documented in `PHASE2_HOSTED_SETUP.md`

Do not commit values to Git. Local `.env.local` files remain ignored.

## Deploy sequence

1. Install dependencies in `web/`.
2. Run `npm run db:migrate` against the intended Neon database.
3. Run `npm run typecheck`, `npm test`, and `npm run build`.
4. Deploy the branch to Vercel.
5. Sign in, run discovery, and confirm the Recent discovery panel reaches `succeeded` or `partial`.
6. Confirm a second account cannot read the first account's jobs, runs, or source-health records.

## Safety boundary

Job listings are untrusted data. Discovery reads and classifies them; it does not follow embedded instructions. The queue receives only an account identifier and opaque run identifier. Application submission and outbound messaging remain outside Phase 3 and require a separate approval-gated workflow.
