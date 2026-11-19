# RoleLinked product roadmap

RoleLinked is a candidate-controlled career operating system. It is not an
auto-apply bot. The product may discover, analyze, draft, organize, and fill a
review surface, but the candidate owns every claim and every external action.

## Product principles

These invariants apply to every hosted and local feature:

1. **Every claim is sourced.** A resume, answer, cover letter, or interview story
   must trace to candidate-approved evidence or be visibly marked unknown.
2. **Every score is explained.** Fit and ATS feedback expose their inputs,
   confidence, limitations, and the difference between facts and heuristics.
3. **Every external action is approved.** Approval is tied to the exact payload,
   expires, and cannot authorize a materially changed submission or message.
4. **Every artifact is versioned and portable.** Candidates can inspect, compare,
   export, and delete their work without being trapped in RoleLinked.
5. **Every account is isolated.** Tenant ownership is enforced server-side for
   database rows, files, jobs, schedules, AI context, and audit records.
6. **External content is untrusted data.** Job listings, forms, company pages,
   and messages never become instructions to RoleLinked.

## What makes RoleLinked different

Most AI job tools optimize one slice of the search: high-volume application,
resume keyword matching, document generation, or pipeline tracking. RoleLinked
connects the entire candidate decision loop while preserving provenance and
human control.

The defensible product layer is:

- an evidence and provenance graph rather than free-form generated claims;
- observable ATS compatibility rather than a fictional pass probability;
- reviewable diffs and exact-payload approvals rather than silent automation;
- one continuous context from discovery through interview and offer;
- hosted convenience plus local/self-hosted portability;
- longitudinal learning from the candidate's own outcomes, with changes proposed
  for approval instead of silently rewriting their profile.

Visual quality remains important, but it supports this trust model rather than
replacing it.

## Completed foundation

### Phase 1 — Hosted foundation

- Vercel production deployment and custom domain;
- CI, security scanning, hosted-mode detection, and safe deployment limits;
- Clerk account boundary and protected workspace routes.

### Phase 2 — Identity and private data

- tenant-scoped profile and onboarding state in Neon;
- private resume uploads with metadata isolation;
- account-specific preferences, resumes, and workspace state;
- cross-account authorization coverage.

### Phase 3 — Discovery and pipeline

- public job-board and ATS discovery;
- normalized, deduplicated job matches with source provenance;
- configurable search profiles and source controls;
- pipeline stages, list/card views, company logos, filters, and status history;
- scheduled discovery with QStash-backed execution and run records.

### Phase 4 — Private career operations

- private document library;
- application packets linked to a saved role and candidate source material;
- immutable job and source snapshots for approved packets;
- approval ledger and server-enforced ownership;
- ATS diagnostics and source catalog controls;
- production deployment at `rolelinked.com`.

## Phase 5 — Evidence and document studio

Phase 5 makes candidate evidence the center of the product and turns document
creation into a transparent, editable, versioned workflow.

### 5.1 Career Evidence Vault

- Store canonical experience, projects, skills, education, certifications,
  work authorization, and quantified achievements as structured evidence.
- Attach each item to its source: uploaded resume, document, candidate statement,
  or explicit confirmation.
- Support durable states: `verified`, `corrected`, `narrative-only`,
  `unknown`, and `derived-unverified`.
- Show where each claim is reused across resume versions and packets.
- Block unsupported or candidate-unconfirmed claims from becoming verified facts.

### 5.2 Master content graph

- Maintain one comprehensive, source-backed career profile.
- Create role-specific views by selecting evidence instead of duplicating text.
- Let candidates toggle bullets, projects, and skills per resume version.
- Offer reviewed synchronization when a source fact changes; never overwrite a
  tailored version silently.

### 5.3 Resume and cover-letter studio

- Structured visual editor as the default authoring surface.
- Optional advanced Markdown/LaTeX editor for precision workflows.
- Split-pane live preview with page-break, overflow, and density feedback.
- Templates and controlled typography, spacing, ordering, and section settings.
- Version history, named variants, side-by-side diff, and restore.
- Export PDF, DOCX, Markdown, and TeX without losing content ownership.

### 5.4 ATS Checker v2

- Parse and display extracted name, contact, employer, title, dates, education,
  skills, and section order so the candidate can see what a parser actually read.
- Diagnose columns, tables, text boxes, headers/footers, image-only text,
  reading order, date ambiguity, and missing standard sections.
- Separate required from preferred job-description terms and exact matches from
  transparent synonym matches.
- Warn about keyword stuffing, unsupported additions, and title inconsistencies.
- Compare the source and tailored resume instead of showing only a single score.
- Label vendor-specific compatibility profiles as heuristics; never promise an
  interview or invent a universal ATS pass probability.

### 5.5 Source-grounded drafting and Ask

- Draft bullets, summaries, cover letters, and form answers only from selected
  evidence and the archived job description.
- Present AI work as a diff with source references and explicit unknowns.
- Require candidate acceptance before changing a document version.
- Route models through a server-side gateway with rate limits, redacted logs,
  cost controls, and provider portability.

### 5.6 Application Packet v2

Each packet contains an immutable, reviewable set of:

- archived job description and source URL;
- selected resume version and export;
- cover letter and saved screening-answer drafts;
- ATS diagnostic report;
- unresolved questions and candidate confirmations;
- readiness checklist and exact approval record.

### Phase 5 exit criteria

- Two-account tests prove database, Blob, AI context, and packet isolation.
- Unsupported claims cannot be stored or exported as verified facts.
- Every generated claim exposes a source or an explicit unknown state.
- Resume versions round-trip through edit, preview, export, and restore.
- A packet pins the exact resume and evidence versions that were approved.
- Delete operations remove private file contents and metadata while retaining
  only the minimum non-sensitive audit evidence required by policy.
- No feature submits a form, sends a message, or changes an external status.

## Phase 6 — Decision and interview intelligence

Phase 6 helps candidates decide where to spend time and carries approved context
through the rest of the search.

### Planned capabilities

- Explainable matching that separates hard constraints from soft fit and shows
  confidence, positive evidence, missing evidence, and disqualifiers.
- Posting legitimacy and liveness signals, repost history, source provenance,
  ATS vendor, compensation quality, and recruiting-friction indicators.
- A daily decision queue ranked by fit, urgency, evidence readiness, and the
  candidate's explicit preferences.
- Company history and candidate-owned contact context, including optional
  offline LinkedIn export matching without signed-in scraping.
- Follow-up reminders and drafts, with sending kept outside the approval gate.
- Interview plans grounded in the exact application packet, STAR-story matching,
  practice, debriefs, and recurring skills-gap analysis.
- Offer comparison, salary evidence, and provenance-backed negotiation drafts.
- Outcome analytics by source, role family, resume version, and pipeline stage;
  recommendations are proposed for review rather than applied silently.

### Phase 6 exit criteria

- Every ranking can explain why a role is high, low, or uncertain.
- Legitimacy and liveness signals are labeled as signals, not guarantees.
- Interview content is limited to approved candidate evidence and packet data.
- Outcome learning never promotes an inferred claim into the Evidence Vault.
- All analytics and history remain tenant-isolated and exportable.

## Phase 7 — Assisted action and production trust

Phase 7 may reduce repetitive work, but it does not transfer final authority away
from the candidate.

### Planned capabilities

- Optional browser extension that fills fields for review but never clicks the
  final submit control.
- Per-answer source, confidence, and uncertainty indicators.
- Exact-payload approval with expiry, material-change detection, and audit trail.
- Read-only email and calendar connections first; any writing remains draft-only
  until a separate, explicit product decision and safety review.
- Privacy control center with a data map, machine-readable export, full account
  deletion, retention controls, and model-provider settings.
- Backup and restore drills, security review, monitoring, cost caps, abuse
  response, incident playbooks, and disaster recovery.
- Portable migration between hosted and local/self-hosted editions.

### Explicit non-goals

- autonomous or bulk application submission;
- covert live-interview assistance;
- automated recruiter messages or mass outreach;
- credential, cookie, or signed-in-session scraping;
- unreviewed changes to application status or candidate evidence.

### Phase 7 exit criteria

- The browser helper cannot submit, send, or authorize itself.
- Every prepared action can be reproduced from its approved payload and audit log.
- Account export and deletion are end-to-end tested across all storage systems.
- Backup restoration, incident response, rate limits, and spend limits are proven
  under production-like load.
- Candidates can leave RoleLinked with their evidence, documents, packets, and
  history in documented formats.

## Build order

The next implementation sequence is:

1. Evidence Vault schema, provenance states, and tenant authorization.
2. Master content graph and versioned resume model.
3. Resume/cover-letter studio with live preview and portable exports.
4. ATS Checker v2 extraction diagnostics and comparison view.
5. Source-grounded drafting and Application Packet v2.
6. Phase 5 security, isolation, deletion, export, and usability verification.

Phase 6 begins only after these Phase 5 exit criteria pass. Phase 7 assisted
actions begin only after the approval and audit model has been independently
reviewed against the no-submit boundary.
