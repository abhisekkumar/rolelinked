import "server-only";

import { and, desc, eq, isNull, lt, or, sql } from "drizzle-orm";

import { requireTenantId } from "@/lib/hosted/tenant-scope.mjs";
import { getHostedDatabase } from "./client";
import {
  candidateProfiles,
  hostedJobs,
  hostedJobStatusEvents,
  resumeVersions,
  resumes,
  searchProfiles,
  users,
} from "./schema";
import { assertHostedJobStatus } from "@/lib/core/hosted-job-match.mjs";

export type SearchProfileInput = {
  targetRoles: string[];
  prioritySkills: string[];
  excludedRoles: string[];
  locations: string[];
  remotePreference: "remote" | "hybrid" | "onsite" | "flexible";
  compensationCurrency: string;
  compensationMinimum: number | null;
  compensationTarget: number | null;
  sponsorshipRequired: boolean;
  approvedI140: boolean;
  cadencePreference: "daily" | "twice-daily" | "weekly";
};

async function setTenant(tx: Parameters<Parameters<ReturnType<typeof getHostedDatabase>["transaction"]>[0]>[0], ownerId: string) {
  await tx.execute(sql`select set_config('rolelinked.owner_id', ${ownerId}, true)`);
}

export async function ensureHostedUser(ownerIdValue: string, timezone = "UTC") {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [user] = await tx
      .insert(users)
      .values({ id: ownerId, timezone, lastSeenAt: new Date(), updatedAt: new Date() })
      .onConflictDoUpdate({
        target: users.id,
        set: { lastSeenAt: new Date(), updatedAt: new Date() },
      })
      .returning();
    return user;
  });
}

export async function getHostedProfile(ownerIdValue: string) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [user] = await tx.select().from(users).where(eq(users.id, ownerId)).limit(1);
    const [candidate] = await tx
      .select()
      .from(candidateProfiles)
      .where(eq(candidateProfiles.ownerId, ownerId))
      .limit(1);
    const [search] = await tx
      .select()
      .from(searchProfiles)
      .where(eq(searchProfiles.ownerId, ownerId))
      .limit(1);
    return { user: user ?? null, candidate: candidate ?? null, search: search ?? null };
  });
}

export async function saveHostedSearchProfile(
  ownerIdValue: string,
  input: SearchProfileInput,
  options: { markOnboardingComplete?: boolean } = {},
) {
  const ownerId = requireTenantId(ownerIdValue);
  await ensureHostedUser(ownerId);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [profile] = await tx
      .insert(searchProfiles)
      .values({ ownerId, ...input, approvalRequired: true, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: searchProfiles.ownerId,
        set: { ...input, approvalRequired: true, updatedAt: new Date() },
      })
      .returning();
    if (options.markOnboardingComplete !== false) {
      await tx
        .update(users)
        .set({ onboardingComplete: true, updatedAt: new Date() })
        .where(eq(users.id, ownerId));
    }
    return profile;
  });
}

export type CreateResumeInput = {
  name: string;
  roleType: string;
  storageKey: string;
  originalFilename: string;
  contentType: string;
  byteSize: number;
  sha256: string;
};

export async function createHostedResume(ownerIdValue: string, input: CreateResumeInput) {
  const ownerId = requireTenantId(ownerIdValue);
  await ensureHostedUser(ownerId);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [resume] = await tx
      .insert(resumes)
      .values({ ownerId, name: input.name, roleType: input.roleType })
      .returning();
    const [version] = await tx
      .insert(resumeVersions)
      .values({
        ownerId,
        resumeId: resume.id,
        version: 1,
        storageKey: input.storageKey,
        originalFilename: input.originalFilename,
        contentType: input.contentType,
        byteSize: input.byteSize,
        sha256: input.sha256,
      })
      .returning();
    return { resume, version };
  });
}

export async function listHostedResumes(ownerIdValue: string) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    return tx
      .select({
        id: resumes.id,
        name: resumes.name,
        roleType: resumes.roleType,
        isDefault: resumes.isDefault,
        updatedAt: resumes.updatedAt,
        version: resumeVersions.version,
        originalFilename: resumeVersions.originalFilename,
        contentType: resumeVersions.contentType,
        byteSize: resumeVersions.byteSize,
      })
      .from(resumes)
      .innerJoin(
        resumeVersions,
        and(eq(resumeVersions.resumeId, resumes.id), eq(resumeVersions.ownerId, ownerId)),
      )
      .where(eq(resumes.ownerId, ownerId))
      .orderBy(desc(resumes.updatedAt), desc(resumeVersions.version));
  });
}

export async function getHostedResumeVersion(ownerIdValue: string, resumeId: string) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [record] = await tx
      .select({ resume: resumes, version: resumeVersions })
      .from(resumes)
      .innerJoin(resumeVersions, eq(resumeVersions.resumeId, resumes.id))
      .where(and(eq(resumes.ownerId, ownerId), eq(resumes.id, resumeId)))
      .orderBy(desc(resumeVersions.version))
      .limit(1);
    return record ?? null;
  });
}

export async function deleteHostedResumeRecord(ownerIdValue: string, resumeId: string) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    return tx
      .delete(resumes)
      .where(and(eq(resumes.ownerId, ownerId), eq(resumes.id, resumeId)))
      .returning({ id: resumes.id });
  });
}

export type HostedJobInput = {
  source: string;
  sourceJobId?: string;
  url: string;
  canonicalUrl: string;
  company: string;
  title: string;
  location?: string;
  descriptionExcerpt?: string;
  postedAt?: string | Date | null;
  matchScore?: number | null;
  matchReasons?: string[];
  matchedSkills?: string[];
  remoteSignal?: string;
  sponsorshipSignal?: string;
  compensationMinimum?: number | null;
  compensationMaximum?: number | null;
  sourceMetadata?: Record<string, unknown>;
};

function validDate(value: HostedJobInput["postedAt"]) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function upsertHostedJobs(ownerIdValue: string, inputs: HostedJobInput[]) {
  const ownerId = requireTenantId(ownerIdValue);
  if (!inputs.length) return [];
  await ensureHostedUser(ownerId);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const saved = [];
    for (const input of inputs) {
      const [job] = await tx
        .insert(hostedJobs)
        .values({
          ownerId,
          source: input.source,
          sourceJobId: input.sourceJobId,
          url: input.url,
          canonicalUrl: input.canonicalUrl,
          company: input.company,
          title: input.title,
          location: input.location || "",
          descriptionExcerpt: input.descriptionExcerpt || "",
          postedAt: validDate(input.postedAt),
          matchScore: input.matchScore ?? null,
          matchReasons: input.matchReasons || [],
          matchedSkills: input.matchedSkills || [],
          remoteSignal: input.remoteSignal || "unknown",
          sponsorshipSignal: input.sponsorshipSignal || "unknown",
          compensationMinimum: input.compensationMinimum ?? null,
          compensationMaximum: input.compensationMaximum ?? null,
          sourceMetadata: input.sourceMetadata || {},
        })
        .onConflictDoUpdate({
          target: [hostedJobs.ownerId, hostedJobs.canonicalUrl],
          set: {
            source: input.source,
            sourceJobId: input.sourceJobId,
            url: input.url,
            company: input.company,
            title: input.title,
            location: input.location || "",
            descriptionExcerpt: input.descriptionExcerpt || "",
            postedAt: validDate(input.postedAt),
            matchScore: input.matchScore ?? null,
            matchReasons: input.matchReasons || [],
            matchedSkills: input.matchedSkills || [],
            remoteSignal: input.remoteSignal || "unknown",
            sponsorshipSignal: input.sponsorshipSignal || "unknown",
            compensationMinimum: input.compensationMinimum ?? null,
            compensationMaximum: input.compensationMaximum ?? null,
            sourceMetadata: input.sourceMetadata || {},
            updatedAt: new Date(),
          },
        })
        .returning();
      saved.push(job);
    }
    return saved;
  });
}

export async function claimHostedDiscoveryRun(ownerIdValue: string, cooldownMs = 5 * 60_000) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  const now = new Date();
  const availableBefore = new Date(now.getTime() - cooldownMs);
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [claimed] = await tx
      .update(searchProfiles)
      .set({ lastDiscoveryAt: now, updatedAt: now })
      .where(and(
        eq(searchProfiles.ownerId, ownerId),
        or(isNull(searchProfiles.lastDiscoveryAt), lt(searchProfiles.lastDiscoveryAt, availableBefore)),
      ))
      .returning({ lastDiscoveryAt: searchProfiles.lastDiscoveryAt });
    return claimed ?? null;
  });
}

export async function listHostedJobs(ownerIdValue: string, options: { status?: string; limit?: number } = {}) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  const limit = Math.max(1, Math.min(options.limit || 250, 500));
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const where = options.status
      ? and(eq(hostedJobs.ownerId, ownerId), eq(hostedJobs.status, assertHostedJobStatus(options.status)))
      : eq(hostedJobs.ownerId, ownerId);
    return tx
      .select()
      .from(hostedJobs)
      .where(where)
      .orderBy(desc(hostedJobs.matchScore), desc(hostedJobs.postedAt), desc(hostedJobs.discoveredAt))
      .limit(limit);
  });
}

export async function updateHostedJobStatus(
  ownerIdValue: string,
  jobId: string,
  nextStatusValue: string,
  note?: string,
) {
  const ownerId = requireTenantId(ownerIdValue);
  const nextStatus = assertHostedJobStatus(nextStatusValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [current] = await tx
      .select()
      .from(hostedJobs)
      .where(and(eq(hostedJobs.ownerId, ownerId), eq(hostedJobs.id, jobId)))
      .limit(1);
    if (!current) return null;
    if (current.status === nextStatus) return current;

    const [updated] = await tx
      .update(hostedJobs)
      .set({ status: nextStatus, statusUpdatedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(hostedJobs.ownerId, ownerId), eq(hostedJobs.id, jobId)))
      .returning();
    await tx.insert(hostedJobStatusEvents).values({
      ownerId,
      jobId,
      fromStatus: current.status,
      toStatus: nextStatus,
      note: note?.trim().slice(0, 500) || null,
    });
    return updated;
  });
}
