import { sql } from "drizzle-orm";
import {
  boolean,
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
    contentType: text("content_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    ...timestamps,
  },
  (table) => [index("documents_owner_idx").on(table.ownerId)],
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
