import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  timezone: text("timezone").default("UTC").notNull(),
  onboardingComplete: boolean("onboarding_complete").default(false).notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
  ...timestamps,
});

export const candidateProfiles = pgTable("candidate_profiles", {
  ownerId: text("owner_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  fullName: text("full_name"),
  headline: text("headline"),
  location: text("location"),
  portfolioUrls: text("portfolio_urls").array().default(sql`'{}'::text[]`).notNull(),
  facts: jsonb("facts").$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
});

export const searchProfiles = pgTable("search_profiles", {
  ownerId: text("owner_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  targetRoles: text("target_roles").array().default(sql`'{}'::text[]`).notNull(),
  prioritySkills: text("priority_skills").array().default(sql`'{}'::text[]`).notNull(),
  excludedRoles: text("excluded_roles").array().default(sql`'{}'::text[]`).notNull(),
  locations: text("locations").array().default(sql`'{}'::text[]`).notNull(),
  remotePreference: text("remote_preference").default("flexible").notNull(),
  compensationCurrency: text("compensation_currency").default("USD").notNull(),
  compensationMinimum: integer("compensation_minimum"),
  compensationTarget: integer("compensation_target"),
  sponsorshipRequired: boolean("sponsorship_required").default(false).notNull(),
  approvedI140: boolean("approved_i140").default(false).notNull(),
  cadencePreference: text("cadence_preference").default("daily").notNull(),
  approvalRequired: boolean("approval_required").default(true).notNull(),
  lastDiscoveryAt: timestamp("last_discovery_at", { withTimezone: true }),
  ...timestamps,
});

export const resumes = pgTable(
  "resumes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    roleType: text("role_type").notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("resumes_owner_name_idx").on(table.ownerId, table.name),
    uniqueIndex("resumes_id_owner_idx").on(table.id, table.ownerId),
  ],
);

export const resumeVersions = pgTable(
  "resume_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    resumeId: uuid("resume_id").notNull(),
    version: integer("version").notNull(),
    storageKey: text("storage_key").notNull(),
    originalFilename: text("original_filename").notNull(),
    contentType: text("content_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    sha256: text("sha256").notNull(),
    source: text("source").default("upload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("resume_versions_resume_version_idx").on(table.resumeId, table.version),
    uniqueIndex("resume_versions_owner_storage_idx").on(table.ownerId, table.storageKey),
    foreignKey({
      columns: [table.resumeId, table.ownerId],
      foreignColumns: [resumes.id, resumes.ownerId],
      name: "resume_versions_resume_owner_fk",
    }).onDelete("cascade"),
  ],
);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    storageKey: text("storage_key").notNull(),
    originalFilename: text("original_filename").default("document").notNull(),
    contentType: text("content_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    sha256: text("sha256").default("").notNull(),
    source: text("source").default("upload").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("documents_id_owner_idx").on(table.id, table.ownerId),
    index("documents_owner_idx").on(table.ownerId),
  ],
);

export const hostedEvidenceItems = pgTable(
  "hosted_evidence_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    title: text("title").notNull(),
    statement: text("statement").notNull(),
    verificationState: text("verification_state").default("derived-unverified").notNull(),
    sourceType: text("source_type").notNull(),
    sourceResumeId: uuid("source_resume_id"),
    sourceDocumentId: uuid("source_document_id"),
    sourceLabel: text("source_label").notNull(),
    sourceExcerpt: text("source_excerpt").notNull(),
    isQuantified: boolean("is_quantified").default(false).notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("hosted_evidence_items_id_owner_idx").on(table.id, table.ownerId),
    index("hosted_evidence_items_owner_state_idx").on(table.ownerId, table.verificationState),
    index("hosted_evidence_items_owner_category_idx").on(table.ownerId, table.category),
    foreignKey({
      columns: [table.sourceResumeId, table.ownerId],
      foreignColumns: [resumes.id, resumes.ownerId],
      name: "hosted_evidence_items_resume_owner_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.sourceDocumentId, table.ownerId],
      foreignColumns: [documents.id, documents.ownerId],
      name: "hosted_evidence_items_document_owner_fk",
    }).onDelete("cascade"),
    check(
      "hosted_evidence_items_verification_state_check",
      sql`${table.verificationState} in ('verified', 'corrected', 'narrative-only', 'unknown', 'derived-unverified', 'user-cannot-confirm')`,
    ),
    check(
      "hosted_evidence_items_source_type_check",
      sql`${table.sourceType} in ('resume', 'document', 'user-statement', 'manual-confirmation')`,
    ),
    check(
      "hosted_evidence_items_source_reference_check",
      sql`(
        (${table.sourceType} = 'resume' and ${table.sourceResumeId} is not null and ${table.sourceDocumentId} is null)
        or (${table.sourceType} = 'document' and ${table.sourceDocumentId} is not null and ${table.sourceResumeId} is null)
        or (${table.sourceType} in ('user-statement', 'manual-confirmation') and ${table.sourceResumeId} is null and ${table.sourceDocumentId} is null)
      )`,
    ),
  ],
);

export const hostedEvidenceEvents = pgTable(
  "hosted_evidence_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    evidenceId: uuid("evidence_id").notNull(),
    event: text("event").notNull(),
    fromState: text("from_state"),
    toState: text("to_state").notNull(),
    details: jsonb("details").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.evidenceId, table.ownerId],
      foreignColumns: [hostedEvidenceItems.id, hostedEvidenceItems.ownerId],
      name: "hosted_evidence_events_item_owner_fk",
    }).onDelete("cascade"),
    index("hosted_evidence_events_owner_item_idx").on(table.ownerId, table.evidenceId),
  ],
);

export const hostedEvidenceUsages = pgTable(
  "hosted_evidence_usages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    evidenceId: uuid("evidence_id").notNull(),
    surfaceType: text("surface_type").notNull(),
    surfaceId: text("surface_id").notNull(),
    surfaceLabel: text("surface_label").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.evidenceId, table.ownerId],
      foreignColumns: [hostedEvidenceItems.id, hostedEvidenceItems.ownerId],
      name: "hosted_evidence_usages_item_owner_fk",
    }).onDelete("cascade"),
    uniqueIndex("hosted_evidence_usages_owner_surface_idx").on(
      table.ownerId,
      table.evidenceId,
      table.surfaceType,
      table.surfaceId,
    ),
  ],
);

export const hostedArtifacts = pgTable(
  "hosted_artifacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    roleFamily: text("role_family").default("").notNull(),
    archived: boolean("archived").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("hosted_artifacts_id_owner_idx").on(table.id, table.ownerId),
    index("hosted_artifacts_owner_kind_idx").on(table.ownerId, table.kind),
    check("hosted_artifacts_kind_check", sql`${table.kind} in ('resume', 'cover-letter')`),
  ],
);

export const hostedArtifactVersions = pgTable(
  "hosted_artifact_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    artifactId: uuid("artifact_id").notNull(),
    version: integer("version").notNull(),
    sourceJobId: uuid("source_job_id"),
    content: jsonb("content").$type<Record<string, unknown>>().default({}).notNull(),
    evidenceIds: uuid("evidence_ids").array().default(sql`'{}'::uuid[]`).notNull(),
    changeSummary: text("change_summary").default("").notNull(),
    restoredFromVersionId: uuid("restored_from_version_id"),
    contentSha256: text("content_sha256").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("hosted_artifact_versions_artifact_version_idx").on(table.artifactId, table.version),
    uniqueIndex("hosted_artifact_versions_id_owner_idx").on(table.id, table.ownerId),
    index("hosted_artifact_versions_owner_artifact_idx").on(table.ownerId, table.artifactId),
    foreignKey({
      columns: [table.artifactId, table.ownerId],
      foreignColumns: [hostedArtifacts.id, hostedArtifacts.ownerId],
      name: "hosted_artifact_versions_artifact_owner_fk",
    }).onDelete("cascade"),
  ],
);

export const hostedJobs = pgTable(
  "hosted_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    source: text("source").notNull(),
    sourceJobId: text("source_job_id"),
    url: text("url").notNull(),
    canonicalUrl: text("canonical_url").notNull(),
    company: text("company").notNull(),
    title: text("title").notNull(),
    location: text("location").default("").notNull(),
    descriptionExcerpt: text("description_excerpt").default("").notNull(),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    discoveredAt: timestamp("discovered_at", { withTimezone: true }).defaultNow().notNull(),
    matchScore: integer("match_score"),
    matchReasons: text("match_reasons").array().default(sql`'{}'::text[]`).notNull(),
    matchedSkills: text("matched_skills").array().default(sql`'{}'::text[]`).notNull(),
    remoteSignal: text("remote_signal").default("unknown").notNull(),
    sponsorshipSignal: text("sponsorship_signal").default("unknown").notNull(),
    compensationMinimum: integer("compensation_minimum"),
    compensationMaximum: integer("compensation_maximum"),
    status: text("status").default("discovered").notNull(),
    statusUpdatedAt: timestamp("status_updated_at", { withTimezone: true }).defaultNow().notNull(),
    sourceMetadata: jsonb("source_metadata").$type<Record<string, unknown>>().default({}).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("hosted_jobs_owner_canonical_url_idx").on(table.ownerId, table.canonicalUrl),
    uniqueIndex("hosted_jobs_id_owner_idx").on(table.id, table.ownerId),
    index("hosted_jobs_owner_status_idx").on(table.ownerId, table.status),
    index("hosted_jobs_owner_discovered_idx").on(table.ownerId, table.discoveredAt),
  ],
);

export const hostedJobStatusEvents = pgTable(
  "hosted_job_status_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: uuid("job_id").notNull(),
    fromStatus: text("from_status").notNull(),
    toStatus: text("to_status").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.jobId, table.ownerId],
      foreignColumns: [hostedJobs.id, hostedJobs.ownerId],
      name: "hosted_job_status_events_job_owner_fk",
    }).onDelete("cascade"),
    index("hosted_job_status_events_owner_job_idx").on(table.ownerId, table.jobId),
  ],
);

export const hostedDiscoveryRuns = pgTable(
  "hosted_discovery_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    trigger: text("trigger").default("manual").notNull(),
    execution: text("execution").default("qstash").notNull(),
    status: text("status").default("queued").notNull(),
    messageId: text("message_id"),
    attempt: integer("attempt").default(0).notNull(),
    sourcesChecked: integer("sources_checked").default(0).notNull(),
    providersSucceeded: integer("providers_succeeded").default(0).notNull(),
    fetchedCount: integer("fetched_count").default(0).notNull(),
    qualifiedCount: integer("qualified_count").default(0).notNull(),
    verificationCount: integer("verification_count").default(0).notNull(),
    rejectedCount: integer("rejected_count").default(0).notNull(),
    savedCount: integer("saved_count").default(0).notNull(),
    failureCount: integer("failure_count").default(0).notNull(),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("hosted_discovery_runs_id_owner_idx").on(table.id, table.ownerId),
    index("hosted_discovery_runs_owner_created_idx").on(table.ownerId, table.createdAt),
  ],
);

export const hostedDiscoverySourceChecks = pgTable(
  "hosted_discovery_source_checks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    runId: uuid("run_id").notNull(),
    source: text("source").notNull(),
    status: text("status").notNull(),
    fetchedCount: integer("fetched_count").default(0).notNull(),
    errorMessage: text("error_message"),
    checkedAt: timestamp("checked_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.runId, table.ownerId],
      foreignColumns: [hostedDiscoveryRuns.id, hostedDiscoveryRuns.ownerId],
      name: "hosted_discovery_source_checks_run_owner_fk",
    }).onDelete("cascade"),
    uniqueIndex("hosted_discovery_source_checks_run_source_idx").on(table.runId, table.source),
    index("hosted_discovery_source_checks_owner_run_idx").on(table.ownerId, table.runId),
  ],
);

export const hostedAtsReports = pgTable(
  "hosted_ats_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: uuid("job_id").notNull(),
    resumeId: uuid("resume_id").notNull(),
    resumeVersionId: uuid("resume_version_id").notNull(),
    analysis: jsonb("analysis").$type<Record<string, unknown>>().default({}).notNull(),
    jobSnapshot: jsonb("job_snapshot").$type<Record<string, unknown>>().default({}).notNull(),
    resumeSha256: text("resume_sha256").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("hosted_ats_reports_id_owner_idx").on(table.id, table.ownerId),
    index("hosted_ats_reports_owner_job_idx").on(table.ownerId, table.jobId),
    foreignKey({
      columns: [table.jobId, table.ownerId],
      foreignColumns: [hostedJobs.id, hostedJobs.ownerId],
      name: "hosted_ats_reports_job_owner_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.resumeId, table.ownerId],
      foreignColumns: [resumes.id, resumes.ownerId],
      name: "hosted_ats_reports_resume_owner_fk",
    }).onDelete("cascade"),
  ],
);

export const hostedApplicationPackets = pgTable(
  "hosted_application_packets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: uuid("job_id").notNull(),
    resumeId: uuid("resume_id"),
    resumeArtifactVersionId: uuid("resume_artifact_version_id"),
    coverLetterVersionId: uuid("cover_letter_version_id"),
    atsReportId: uuid("ats_report_id"),
    approvalFingerprint: text("approval_fingerprint"),
    status: text("status").default("draft").notNull(),
    sourceSnapshot: jsonb("source_snapshot")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    content: jsonb("content")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    reviewNotes: text("review_notes"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("hosted_application_packets_owner_job_idx").on(table.ownerId, table.jobId),
    uniqueIndex("hosted_application_packets_id_owner_idx").on(table.id, table.ownerId),
    foreignKey({
      columns: [table.jobId, table.ownerId],
      foreignColumns: [hostedJobs.id, hostedJobs.ownerId],
      name: "hosted_application_packets_job_owner_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.resumeId, table.ownerId],
      foreignColumns: [resumes.id, resumes.ownerId],
      name: "hosted_application_packets_resume_owner_fk",
    }).onDelete("no action"),
    foreignKey({
      columns: [table.resumeArtifactVersionId, table.ownerId],
      foreignColumns: [hostedArtifactVersions.id, hostedArtifactVersions.ownerId],
      name: "hosted_application_packets_resume_artifact_owner_fk",
    }).onDelete("no action"),
    foreignKey({
      columns: [table.coverLetterVersionId, table.ownerId],
      foreignColumns: [hostedArtifactVersions.id, hostedArtifactVersions.ownerId],
      name: "hosted_application_packets_cover_letter_owner_fk",
    }).onDelete("no action"),
    foreignKey({
      columns: [table.atsReportId, table.ownerId],
      foreignColumns: [hostedAtsReports.id, hostedAtsReports.ownerId],
      name: "hosted_application_packets_ats_report_owner_fk",
    }).onDelete("no action"),
    index("hosted_application_packets_owner_status_idx").on(table.ownerId, table.status),
  ],
);

export const hostedApplicationPacketEvents = pgTable(
  "hosted_application_packet_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    packetId: uuid("packet_id").notNull(),
    event: text("event").notNull(),
    details: jsonb("details").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.packetId, table.ownerId],
      foreignColumns: [hostedApplicationPackets.id, hostedApplicationPackets.ownerId],
      name: "hosted_application_packet_events_packet_owner_fk",
    }).onDelete("cascade"),
    index("hosted_application_packet_events_owner_packet_idx").on(table.ownerId, table.packetId),
  ],
);

export const hostedAutomationSchedules = pgTable(
  "hosted_automation_schedules",
  {
    ownerId: text("owner_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    enabled: boolean("enabled").default(false).notNull(),
    cadence: text("cadence").default("daily").notNull(),
    localTime: text("local_time").default("09:00").notNull(),
    timezone: text("timezone").default("UTC").notNull(),
    qstashScheduleId: text("qstash_schedule_id"),
    nextRunAt: timestamp("next_run_at", { withTimezone: true }),
    lastError: text("last_error"),
    ...timestamps,
  },
);

export const hostedSourcePreferences = pgTable(
  "hosted_source_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceKey: text("source_key").notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("hosted_source_preferences_owner_source_idx").on(table.ownerId, table.sourceKey),
    index("hosted_source_preferences_owner_idx").on(table.ownerId),
  ],
);

export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  ownerId: text("owner_id"),
  processedAt: timestamp("processed_at", { withTimezone: true }).defaultNow().notNull(),
});

export const accountDeletionRequests = pgTable(
  "account_deletion_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: text("owner_id").notNull(),
    status: text("status").default("pending").notNull(),
    requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    failureReason: text("failure_reason"),
  },
  (table) => [index("account_deletion_requests_owner_idx").on(table.ownerId)],
);

export type SearchProfile = typeof searchProfiles.$inferSelect;
export type Resume = typeof resumes.$inferSelect;
export type ResumeVersion = typeof resumeVersions.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type HostedEvidenceItem = typeof hostedEvidenceItems.$inferSelect;
export type HostedEvidenceEvent = typeof hostedEvidenceEvents.$inferSelect;
export type HostedEvidenceUsage = typeof hostedEvidenceUsages.$inferSelect;
export type HostedJob = typeof hostedJobs.$inferSelect;
export type HostedDiscoveryRun = typeof hostedDiscoveryRuns.$inferSelect;
export type HostedDiscoverySourceCheck = typeof hostedDiscoverySourceChecks.$inferSelect;
export type HostedApplicationPacket = typeof hostedApplicationPackets.$inferSelect;
export type HostedAutomationSchedule = typeof hostedAutomationSchedules.$inferSelect;
export type HostedSourcePreference = typeof hostedSourcePreferences.$inferSelect;
