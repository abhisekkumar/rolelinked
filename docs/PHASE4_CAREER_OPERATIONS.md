# Phase 4: private career operations

Phase 4 turns the hosted RoleLinked workspace into an approval-gated career
operations system. It adds account-private source controls, documents,
application packets, and scheduled discovery without adding any automatic
application submission or outbound messaging.

## What is live

- **Documents:** authenticated users can upload, preview, download, and delete
  private supporting files. Blob paths are tenant-namespaced; metadata and
  ownership are enforced in Postgres with forced row-level security.
- **Application packets:** a pipeline role can open directly in a private
  packet containing an approved resume selection, supported summary, cover
  note, exact application questions and truthful answers, review notes, and an
  internal approval state.
- **Immutable source context:** each packet snapshots the saved job facts used
  during preparation so later posting changes do not silently rewrite the
  review context.
- **Approval ledger:** every packet state change appends a tenant-private event.
  `approved` means approved inside RoleLinked only. It never submits a form or
  sends a message.
- **Source controls:** users can enable or disable individual public job boards
  and company ATS feeds for future discovery runs. A saved preference is an
  override; sources without an override keep their default behavior.
- **Scheduled discovery:** QStash can trigger daily, twice-daily, or weekly
  account-private discovery in the user's IANA timezone. Scheduled runs may
  research and save leads, but may not change pipeline stages or take external
  actions.

## Required services

Phase 4 uses the Phase 2 and Phase 3 services:

- Clerk for identity;
- Neon Postgres for tenant-private records and event history;
- Vercel Private Blob for resumes and documents;
- Upstash QStash for signed scheduled-discovery triggers.

The required environment variables are documented in
`docs/PHASE2_HOSTED_SETUP.md` and `docs/PHASE3_HOSTED_DISCOVERY.md`. Optional
Vercel deployment protection can be bypassed for the QStash trigger with the
server-only `VERCEL_AUTOMATION_BYPASS_SECRET`. Never commit any value.

## Deploy sequence

From `web/`:

```bash
npm install
npm run db:migrate
npm run typecheck
npm test
npm run build
```

Deploy the Phase 4 branch to a Vercel Preview environment first. Configure the
same private Blob, Neon, Clerk, and QStash variables for that environment. Do
not point a Preview deployment at production data unless the intended test is
explicitly read/write-safe.

## Account-isolation test

Use two disposable Clerk accounts and harmless test files:

1. Account A uploads a test document, creates a packet, changes its internal
   state, changes one source preference, and saves a discovery schedule.
2. Account B must not list, preview, download, update, or delete any Account A
   record, even when given its UUID directly.
3. Account B creates different records and Account A must not see them.
4. Delete a resume referenced by a packet. The private resume is removed while
   the packet and its source snapshot remain available with no resume selected.
5. Disable one discovery source. Confirm all other default sources still run.
6. Pause the schedule and confirm its QStash schedule is removed.

## Safety boundary

Job listings and application questions are untrusted input. They may influence
matching and the text the user chooses to review, but they cannot issue
instructions, reveal secrets, or change system behavior. Packet fields are
manual and source-backed in this phase; empty is preferable to an invented
qualification. Application submission, form filling, recruiter messaging, and
automatic pipeline-stage changes remain intentionally unavailable.

## Next phase

The next phase may add source-grounded AI drafting and interview preparation,
but only after retrieval provenance, per-claim review, and the same explicit
approval boundary are enforced. External actions remain a separate, later
decision.
