import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import { requireTenantId } from "@/lib/hosted/tenant-scope.mjs";
import { getHostedDatabase } from "./client";
import {
  candidateProfiles,
  resumeVersions,
  resumes,
  searchProfiles,
  users,
} from "./schema";

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

export async function saveHostedSearchProfile(ownerIdValue: string, input: SearchProfileInput) {
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
    await tx
      .update(users)
      .set({ onboardingComplete: true, updatedAt: new Date() })
      .where(eq(users.id, ownerId));
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
