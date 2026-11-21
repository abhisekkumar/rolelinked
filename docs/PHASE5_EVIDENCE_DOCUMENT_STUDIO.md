# Phase 5 — Evidence and Document Studio

Status: **complete and validated** on `codex/phase-5-evidence-document-studio`.

Completed November 20, 2026. The implementation includes the Career Evidence
Vault, immutable resume and cover-letter artifacts, Claim Passport source links,
review-first grounded drafting, inspectable ATS diagnostics, exact packet
approval fingerprints, and the complete private-file lifecycle. Validation ran
the full 1,140-test web suite, TypeScript, and the production build.

Phase 5 turns RoleLinked's private career workspace into a provenance-aware
authoring system. It must make truthful preparation easier without turning AI
suggestions, uploaded text, or inferred metrics into approved candidate facts.

## Phase 5 product contract

- Every factual claim has an inspectable source or an explicit unknown state.
- New and extracted evidence begins unverified.
- Unverified findings use four separate candidate outcomes: confirm as written,
  provide corrected wording, mark narrative-only, or mark “I don't know.”
- `user-cannot-confirm` and `narrative-only` never become verified through reuse,
  model output, import, or rescanning.
- AI changes appear as reviewable diffs and never silently replace candidate text.
- Application packets pin exact document and evidence versions.
- Nothing in this phase submits an application, sends a message, accepts an
  attestation, or changes an externally visible status.

## Milestone 5.1 — Career Evidence Vault

### Data model

- Tenant-owned evidence items with category, title, exact statement, quantified
  flag, verification state, source label, and source excerpt.
- Owner-aware references to a private resume or document; direct candidate
  statements remain explicit source types rather than anonymous facts.
- Append-only evidence decision events without copying private statement text
  into the audit detail payload.
- Evidence usage links for resume versions, application packets, cover letters,
  screening answers, interview stories, and future artifacts.
- Database constraints for valid verification states and source/reference shape.
- Forced PostgreSQL row-level security on evidence, events, and usages.

### User experience

- Evidence summary for total, review-needed, verified, and usage counts.
- Category and state filtering.
- Provenance viewer with exact supporting excerpt.
- Four-outcome review surface that never asks the user to guess a number.
- Clear distinction among verified facts, corrected facts, narrative context,
  unknowns, unverified derivations, and facts the user cannot confirm.
- Deletion and future usage visibility.

### Completion checks

- Cross-account API and RLS tests cover every evidence table and source link.
- Browser payloads cannot supply an owner ID or arbitrary verification state.
- Composite foreign keys prevent cross-tenant resume/document references.
- Durable non-fact states cannot be promoted by the decision reducer.

## Milestone 5.2 — Master content graph

- **Implemented foundation:** verified/corrected evidence can now be pinned to
  application packets. Packet saves replace their exact usage links in one
  tenant-scoped transaction, and the Evidence Vault shows the artifacts using
  each claim.
- Build one comprehensive profile from candidate-approved evidence.
- Create role-family views by selecting evidence rather than duplicating facts.
- Toggle bullets, projects, achievements, and skills for each resume version.
- Show every artifact currently using an evidence item.
- Propose synchronized changes when a source fact changes; never overwrite an
  existing tailored version without review.
- Support any profession or role family rather than a fixed technology taxonomy.

## Milestone 5.3 — Resume Studio

- Structured visual editor with accessible forms and section reordering.
- Optional Markdown and LaTeX editing for advanced users.
- Split-pane live PDF preview with page-break, density, and overflow warnings.
- ATS-safe templates with controlled typography, spacing, ordering, and sections.
- Named resume variants, version history, side-by-side diff, and restore.
- Original-versus-tailored comparison.
- Portable PDF, DOCX, Markdown, and TeX export.

## Milestone 5.4 — Cover Letter Studio

- Job-specific, evidence-backed drafting.
- Editable tone, length, company context, and paragraph structure.
- Source references for every factual paragraph.
- Live preview, version history, comparison, and PDF/DOCX export.
- No unsupported accomplishment may be introduced from a job description.

## Milestone 5.5 — ATS Checker v2

### Parser visibility

- Display extracted contact information, employers, titles, dates, education,
  certifications, skills, headings, and reading order.
- Diagnose columns, tables, text boxes, headers/footers, image-only text,
  ambiguous dates, missing standard sections, and overflow.

### Match diagnostics

- Separate required and preferred qualifications.
- Distinguish exact keyword matches from disclosed synonym matches.
- Separate a supported-but-missing term from a genuine career-skill gap.
- Detect unsupported keyword suggestions, stuffing, title inconsistencies, and
  seniority mismatches.
- Compare source and tailored versions rather than presenting an isolated score.
- Label vendor profiles as compatibility heuristics; never advertise a universal
  ATS pass probability or guaranteed interview outcome.

## Milestone 5.6 — Source-grounded Ask and drafting

- Use only selected Evidence Vault records and the archived job description.
- Attach evidence references and explicit unknowns to every generated claim.
- Present additions, removals, and rewrites as a diff requiring acceptance.
- Use a server-side model gateway with provider portability, redacted logs,
  rate limits, usage accounting, and cost controls.
- Prevent external listings, form fields, and messages from acting as instructions.

## Milestone 5.7 — Application Packet v2

Each packet pins:

- archived job description and public source URL;
- job/company snapshot;
- selected resume version;
- selected evidence versions;
- cover-letter version;
- screening-answer drafts;
- ATS report;
- unresolved questions and candidate confirmations;
- readiness checklist and exact approval record.

The workspace will support guided construction, completion state, previews,
version comparison, cloning for a similar role, export, and archival. Approval
of one packet or version never authorizes another.

## Milestone 5.8 — Source and ATS expansion

Planned hosted providers include Greenhouse, Lever, Ashby, Workday, iCIMS,
Dayforce, RemoteOK, Remotive, Himalayas, and candidate-selected public company
career sites. Each provider must expose health, last successful scan, posting
count, failure reason, deduplication behavior, expiration signals, and per-account
controls. More listings are not a success metric if relevance declines.

## Milestone 5.9 — Private document lifecycle

- Authenticated preview for supported uploaded and generated formats.
- Original filename, source, checksum, version, and artifact usage metadata.
- Rename, replace, download, and deletion workflows.
- Storage reconciliation so database failure cannot silently orphan a Blob.
- End-to-end tests that deletion removes both private content and metadata.

## Phase 5 exit criteria

- Two independent accounts cannot access one another's evidence, objects,
  AI context, versions, or packets.
- Unsupported claims cannot be stored or exported as verified facts.
- Every generated factual claim exposes its evidence or an explicit unknown.
- Resume and cover-letter versions round-trip through editing, preview, export,
  comparison, and restore.
- Packets pin the exact evidence and document versions reviewed by the candidate.
- Deletion is verified across Neon and private Blob storage.
- ATS findings expose methodology and limitations.
- No Phase 5 endpoint can submit, send, or authorize itself.

## Exit verification

- Forced tenant RLS covers evidence, events, usages, artifacts, artifact
  versions, ATS reports, packets, packet events, and model-usage accounting.
- Private object keys are tenant namespaced; authenticated preview/download and
  deletion contracts are regression tested.
- Grounded drafting accepts only selected verified/corrected evidence, attaches
  claim citations, records redacted usage metadata, rate-limits requests, and
  requires an explicit accept/keep-current decision in the packet editor.
- Artifact saves are immutable, diffable, restorable, exportable to print/PDF,
  Word-compatible document, Markdown, and TeX, and retain exact evidence links.
- Packet approval snapshots job, document hashes, ATS fingerprint, evidence
  statements, provenance, and evidence fingerprints into one SHA-256 approval
  fingerprint. Any material change creates a different approval record.
- ATS results expose parser-visible content, reading order, layout warnings,
  disclosed synonym matches, methodology, and limitations. They explicitly do
  not claim a universal pass probability.
- Resume/document rename, replacement, preview, download, and deletion are
  available. Resume deletion removes every stored immutable file version before
  deleting metadata; failed uploads clean the newly created object.
- A route-surface regression test rejects Phase 5 submission, messaging, and
  external-authorization calls.

## Later phases already reserved

Phase 6 adds explainable matching, legitimacy/liveness/repost signals, the daily
decision queue, candidate-owned company/contact history, follow-up preparation,
packet-grounded interview practice, offer comparison, and outcome learning.

Phase 7 adds an optional review-first browser helper, exact-payload approvals,
read-only email/calendar integrations, a privacy control center, account export
and deletion, hosted/local portability, backups, disaster recovery, monitoring,
cost controls, and independent approval-boundary review.
