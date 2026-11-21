import "server-only";

import { and, desc, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";

import { requireTenantId } from "@/lib/hosted/tenant-scope.mjs";
import { getHostedDatabase } from "./client";
import {
  candidateProfiles,
  documents,
  hostedArtifacts,
  hostedArtifactVersions,
  hostedAtsReports,
  hostedApplicationPacketEvents,
  hostedApplicationPackets,
  hostedAutomationSchedules,
  hostedDiscoveryRuns,
  hostedDiscoverySourceChecks,
  hostedEvidenceEvents,
  hostedEvidenceItems,
  hostedEvidenceUsages,
  hostedJobs,
  hostedJobStatusEvents,
  hostedModelUsage,
  hostedSourcePreferences,
  resumeVersions,
  resumes,
  searchProfiles,
  users,
} from "./schema";
import type { HostedDiscoveryRun, HostedDiscoverySourceCheck } from "./schema";
import { applyEvidenceDecision } from "@/lib/hosted/evidence-provenance.mjs";
import { assertHostedJobStatus } from "@/lib/core/hosted-job-match.mjs";
import {
  HOSTED_DISCOVERY_QUEUED_TIMEOUT_MESSAGE,
  HOSTED_DISCOVERY_RUNNING_TIMEOUT_MESSAGE,
  hostedDiscoveryStaleCutoffs,
} from "@/lib/hosted/discovery-run-health.mjs";
import { artifactContentSha256, artifactEvidenceIds, artifactVersionDiff } from "@/lib/hosted/artifact-version-core.mjs";
import { packetApprovalFingerprint, packetApprovalPayload } from "@/lib/hosted/packet-approval-core.mjs";

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

export type CreateDocumentInput = {
  kind: string;
  title: string;
  storageKey: string;
  originalFilename: string;
  contentType: string;
  byteSize: number;
  sha256: string;
};

export type CreateEvidenceInput = {
  category: string;
  title: string;
  statement: string;
  sourceType: "resume" | "document" | "user-statement" | "manual-confirmation";
  sourceResumeId?: string | null;
  sourceDocumentId?: string | null;
  sourceLabel: string;
  sourceExcerpt: string;
  isQuantified: boolean;
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

export async function listHostedResumeStorageKeys(ownerIdValue: string, resumeId: string) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    return tx.select({ storageKey: resumeVersions.storageKey }).from(resumeVersions).where(and(
      eq(resumeVersions.ownerId, ownerId),
      eq(resumeVersions.resumeId, resumeId),
    ));
  });
}

export async function updateHostedResumeMetadata(ownerIdValue: string, resumeId: string, input: { name: string; roleType: string }) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [resume] = await tx.update(resumes).set({ ...input, updatedAt: new Date() }).where(and(
      eq(resumes.ownerId, ownerId),
      eq(resumes.id, resumeId),
    )).returning();
    return resume || null;
  });
}

export async function appendHostedResumeVersion(ownerIdValue: string, resumeId: string, input: Omit<CreateResumeInput, "name" | "roleType">) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [resume] = await tx.select({ id: resumes.id }).from(resumes).where(and(eq(resumes.ownerId, ownerId), eq(resumes.id, resumeId))).limit(1);
    if (!resume) return null;
    const [latest] = await tx.select({ version: resumeVersions.version }).from(resumeVersions).where(and(eq(resumeVersions.ownerId, ownerId), eq(resumeVersions.resumeId, resumeId))).orderBy(desc(resumeVersions.version)).limit(1);
    const [version] = await tx.insert(resumeVersions).values({ ownerId, resumeId, version: (latest?.version || 0) + 1, ...input }).returning();
    await tx.update(resumes).set({ updatedAt: new Date() }).where(and(eq(resumes.ownerId, ownerId), eq(resumes.id, resumeId)));
    return version;
  });
}

export async function deleteHostedResumeRecord(ownerIdValue: string, resumeId: string) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    // Preserve application-packet history while releasing the reference before
    // the tenant-owned resume is deleted. The composite tenant FK deliberately
    // cannot use SET NULL because that would also null the packet owner.
    await tx
      .update(hostedApplicationPackets)
      .set({ resumeId: null, updatedAt: new Date() })
      .where(and(
        eq(hostedApplicationPackets.ownerId, ownerId),
        eq(hostedApplicationPackets.resumeId, resumeId),
      ));
    return tx
      .delete(resumes)
      .where(and(eq(resumes.ownerId, ownerId), eq(resumes.id, resumeId)))
      .returning({ id: resumes.id });
  });
}

export async function createHostedDocument(ownerIdValue: string, input: CreateDocumentInput) {
  const ownerId = requireTenantId(ownerIdValue);
  await ensureHostedUser(ownerId);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [document] = await tx
      .insert(documents)
      .values({ ownerId, ...input })
      .returning();
    return document;
  });
}

export async function listHostedDocuments(ownerIdValue: string) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    return tx
      .select()
      .from(documents)
      .where(eq(documents.ownerId, ownerId))
      .orderBy(desc(documents.updatedAt));
  });
}

export async function getHostedDocument(ownerIdValue: string, documentId: string) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [document] = await tx
      .select()
      .from(documents)
      .where(and(eq(documents.ownerId, ownerId), eq(documents.id, documentId)))
      .limit(1);
    return document ?? null;
  });
}

export async function updateHostedDocument(ownerIdValue: string, documentId: string, input: Partial<CreateDocumentInput>) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [document] = await tx.update(documents).set({ ...input, updatedAt: new Date() }).where(and(
      eq(documents.ownerId, ownerId),
      eq(documents.id, documentId),
    )).returning();
    return document || null;
  });
}

export async function deleteHostedDocumentRecord(ownerIdValue: string, documentId: string) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    return tx
      .delete(documents)
      .where(and(eq(documents.ownerId, ownerId), eq(documents.id, documentId)))
      .returning({ id: documents.id });
  });
}

export async function listHostedEvidence(ownerIdValue: string) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const items = await tx
      .select()
      .from(hostedEvidenceItems)
      .where(eq(hostedEvidenceItems.ownerId, ownerId))
      .orderBy(desc(hostedEvidenceItems.updatedAt));
    const usages = await tx
      .select()
      .from(hostedEvidenceUsages)
      .where(eq(hostedEvidenceUsages.ownerId, ownerId))
      .orderBy(desc(hostedEvidenceUsages.createdAt));
    const usageMap = new Map<string, typeof usages>();
    for (const usage of usages) {
      const existing = usageMap.get(usage.evidenceId) || [];
      existing.push(usage);
      usageMap.set(usage.evidenceId, existing);
    }
    return items.map((item) => {
      const itemUsages = usageMap.get(item.id) || [];
      return { ...item, usageCount: itemUsages.length, usages: itemUsages };
    });
  });
}

export async function getHostedEvidenceItem(ownerIdValue: string, evidenceId: string) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [item] = await tx
      .select()
      .from(hostedEvidenceItems)
      .where(and(eq(hostedEvidenceItems.ownerId, ownerId), eq(hostedEvidenceItems.id, evidenceId)))
      .limit(1);
    return item ?? null;
  });
}

export async function createHostedEvidence(ownerIdValue: string, input: CreateEvidenceInput) {
  const ownerId = requireTenantId(ownerIdValue);
  await ensureHostedUser(ownerId);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);

    if (input.sourceType === "resume") {
      const [source] = await tx
        .select({ id: resumes.id })
        .from(resumes)
        .where(and(eq(resumes.ownerId, ownerId), eq(resumes.id, input.sourceResumeId || "")))
        .limit(1);
      if (!source) throw new Error("The selected resume source was not found.");
    }
    if (input.sourceType === "document") {
      const [source] = await tx
        .select({ id: documents.id })
        .from(documents)
        .where(and(eq(documents.ownerId, ownerId), eq(documents.id, input.sourceDocumentId || "")))
        .limit(1);
      if (!source) throw new Error("The selected document source was not found.");
    }

    const [item] = await tx
      .insert(hostedEvidenceItems)
      .values({
        ownerId,
        category: input.category,
        title: input.title,
        statement: input.statement,
        verificationState: "derived-unverified",
        sourceType: input.sourceType,
        sourceResumeId: input.sourceType === "resume" ? input.sourceResumeId : null,
        sourceDocumentId: input.sourceType === "document" ? input.sourceDocumentId : null,
        sourceLabel: input.sourceLabel,
        sourceExcerpt: input.sourceExcerpt,
        isQuantified: input.isQuantified,
      })
      .returning();
    await tx.insert(hostedEvidenceEvents).values({
      ownerId,
      evidenceId: item.id,
      event: "created",
      fromState: null,
      toState: item.verificationState,
      details: { sourceType: item.sourceType },
    });
    return item;
  });
}

export async function decideHostedEvidence(
  ownerIdValue: string,
  evidenceId: string,
  decision: { action: "confirm" | "correct" | "narrative-only" | "cannot-confirm"; statement?: string },
) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [current] = await tx
      .select()
      .from(hostedEvidenceItems)
      .where(and(eq(hostedEvidenceItems.ownerId, ownerId), eq(hostedEvidenceItems.id, evidenceId)))
      .limit(1);
    if (!current) return null;

    const next = applyEvidenceDecision(current, decision);
    const [item] = await tx
      .update(hostedEvidenceItems)
      .set({ ...next, confirmedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(hostedEvidenceItems.ownerId, ownerId), eq(hostedEvidenceItems.id, evidenceId)))
      .returning();
    await tx.insert(hostedEvidenceEvents).values({
      ownerId,
      evidenceId,
      event: decision.action,
      fromState: current.verificationState,
      toState: item.verificationState,
      details: { statementChanged: current.statement !== item.statement },
    });
    return item;
  });
}

export async function deleteHostedEvidence(ownerIdValue: string, evidenceId: string) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    return tx
      .delete(hostedEvidenceItems)
      .where(and(eq(hostedEvidenceItems.ownerId, ownerId), eq(hostedEvidenceItems.id, evidenceId)))
      .returning({ id: hostedEvidenceItems.id });
  });
}

export type HostedArtifactVersionInput = {
  artifactId?: string | null;
  kind: "resume" | "cover-letter";
  title: string;
  roleFamily?: string;
  sourceJobId?: string | null;
  evidenceIds: string[];
  changeSummary?: string;
  restoredFromVersionId?: string | null;
  content: Record<string, unknown>;
};

export async function listHostedArtifacts(
  ownerIdValue: string,
  options: { kind?: "resume" | "cover-letter" } = {},
) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const artifactRows = await tx
      .select()
      .from(hostedArtifacts)
      .where(and(
        eq(hostedArtifacts.ownerId, ownerId),
        options.kind ? eq(hostedArtifacts.kind, options.kind) : sql`true`,
      ))
      .orderBy(desc(hostedArtifacts.updatedAt));
    if (!artifactRows.length) return [];
    const versionRows = await tx
      .select()
      .from(hostedArtifactVersions)
      .where(and(
        eq(hostedArtifactVersions.ownerId, ownerId),
        inArray(hostedArtifactVersions.artifactId, artifactRows.map((item) => item.id)),
      ))
      .orderBy(desc(hostedArtifactVersions.version));
    return artifactRows.map((artifact) => {
      const versions = versionRows.filter((version) => version.artifactId === artifact.id);
      return { artifact, latestVersion: versions[0] || null, versionCount: versions.length };
    });
  });
}

export async function getHostedArtifact(ownerIdValue: string, artifactId: string) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [artifact] = await tx
      .select()
      .from(hostedArtifacts)
      .where(and(eq(hostedArtifacts.ownerId, ownerId), eq(hostedArtifacts.id, artifactId)))
      .limit(1);
    if (!artifact) return null;
    const versions = await tx
      .select()
      .from(hostedArtifactVersions)
      .where(and(
        eq(hostedArtifactVersions.ownerId, ownerId),
        eq(hostedArtifactVersions.artifactId, artifactId),
      ))
      .orderBy(desc(hostedArtifactVersions.version));
    return { artifact, latestVersion: versions[0] || null, versions };
  });
}

export async function saveHostedArtifactVersion(
  ownerIdValue: string,
  input: HostedArtifactVersionInput,
) {
  const ownerId = requireTenantId(ownerIdValue);
  await ensureHostedUser(ownerId);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const selectedEvidenceIds = [...new Set(input.evidenceIds)];
    if (!selectedEvidenceIds.length) {
      throw new Error("Select at least one verified evidence item for this artifact.");
    }
    const usedEvidenceIds = artifactEvidenceIds(input.content);
    if (usedEvidenceIds.some((id) => !selectedEvidenceIds.includes(id))) {
      throw new Error("Every artifact claim must be pinned to selected evidence.");
    }
    const evidence = await tx
      .select({
        id: hostedEvidenceItems.id,
        title: hostedEvidenceItems.title,
        verificationState: hostedEvidenceItems.verificationState,
      })
      .from(hostedEvidenceItems)
      .where(and(
        eq(hostedEvidenceItems.ownerId, ownerId),
        inArray(hostedEvidenceItems.id, selectedEvidenceIds),
      ));
    if (evidence.length !== selectedEvidenceIds.length) {
      throw new Error("One or more artifact sources were not found in this workspace.");
    }
    if (evidence.some((item) => !["verified", "corrected"].includes(item.verificationState))) {
      throw new Error("Artifacts can only use verified or corrected evidence.");
    }
    if (input.sourceJobId) {
      const [job] = await tx
        .select({ id: hostedJobs.id })
        .from(hostedJobs)
        .where(and(eq(hostedJobs.ownerId, ownerId), eq(hostedJobs.id, input.sourceJobId)))
        .limit(1);
      if (!job) throw new Error("The selected job source was not found in this workspace.");
    }

    let artifact;
    if (input.artifactId) {
      [artifact] = await tx
        .select()
        .from(hostedArtifacts)
        .where(and(eq(hostedArtifacts.ownerId, ownerId), eq(hostedArtifacts.id, input.artifactId)))
        .limit(1);
      if (!artifact || artifact.kind !== input.kind) throw new Error("Artifact not found in this workspace.");
      [artifact] = await tx
        .update(hostedArtifacts)
        .set({ title: input.title, roleFamily: input.roleFamily || "", updatedAt: new Date() })
        .where(and(eq(hostedArtifacts.ownerId, ownerId), eq(hostedArtifacts.id, input.artifactId)))
        .returning();
    } else {
      [artifact] = await tx
        .insert(hostedArtifacts)
        .values({
          ownerId,
          kind: input.kind,
          title: input.title,
          roleFamily: input.roleFamily || "",
        })
        .returning();
    }

    const previousRows = await tx
      .select()
      .from(hostedArtifactVersions)
      .where(and(
        eq(hostedArtifactVersions.ownerId, ownerId),
        eq(hostedArtifactVersions.artifactId, artifact.id),
      ))
      .orderBy(desc(hostedArtifactVersions.version))
      .limit(1);
    const previous = previousRows[0] || null;
    if (input.restoredFromVersionId) {
      const [restored] = await tx
        .select({ id: hostedArtifactVersions.id })
        .from(hostedArtifactVersions)
        .where(and(
          eq(hostedArtifactVersions.ownerId, ownerId),
          eq(hostedArtifactVersions.artifactId, artifact.id),
          eq(hostedArtifactVersions.id, input.restoredFromVersionId),
        ))
        .limit(1);
      if (!restored) throw new Error("The restore source is not part of this artifact.");
    }
    const [version] = await tx
      .insert(hostedArtifactVersions)
      .values({
        ownerId,
        artifactId: artifact.id,
        version: (previous?.version || 0) + 1,
        sourceJobId: input.sourceJobId || null,
        content: input.content,
        evidenceIds: selectedEvidenceIds,
        changeSummary: input.changeSummary || "",
        restoredFromVersionId: input.restoredFromVersionId || null,
        contentSha256: artifactContentSha256(input.content),
      })
      .returning();

    if (selectedEvidenceIds.length) {
      await tx.insert(hostedEvidenceUsages).values(selectedEvidenceIds.map((evidenceId) => ({
        ownerId,
        evidenceId,
        surfaceType: `${input.kind}-version`,
        surfaceId: version.id,
        surfaceLabel: `${artifact.title} · v${version.version}`,
      })));
    }
    return {
      artifact,
      version,
      diff: artifactVersionDiff(previous?.content || { blocks: [] }, input.content),
    };
  });
}

export async function archiveHostedArtifact(ownerIdValue: string, artifactId: string) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    return tx
      .update(hostedArtifacts)
      .set({ archived: true, updatedAt: new Date() })
      .where(and(eq(hostedArtifacts.ownerId, ownerId), eq(hostedArtifacts.id, artifactId)))
      .returning();
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

export type HostedDiscoveryRunResult = {
  sourcesChecked: number;
  providersSucceeded: number;
  fetchedCount: number;
  qualifiedCount: number;
  verificationCount: number;
  rejectedCount: number;
  savedCount: number;
  failures: Array<{ source: string; error: string }>;
  sourceResults: Array<{ source: string; jobs: unknown[]; error?: string }>;
};

export async function createHostedDiscoveryRun(
  ownerIdValue: string,
  input: { trigger?: string; execution?: string } = {},
) {
  const ownerId = requireTenantId(ownerIdValue);
  await ensureHostedUser(ownerId);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [run] = await tx
      .insert(hostedDiscoveryRuns)
      .values({
        ownerId,
        trigger: input.trigger || "manual",
        execution: input.execution || "qstash",
      })
      .returning();
    return run;
  });
}

export async function reconcileStaleHostedDiscoveryRuns(
  ownerIdValue: string,
  nowValue = new Date(),
) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  const now = new Date(nowValue.getTime());
  const { queuedBefore, runningBefore } = hostedDiscoveryStaleCutoffs(now);

  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const queued = await tx
      .update(hostedDiscoveryRuns)
      .set({
        status: "failed",
        errorMessage: HOSTED_DISCOVERY_QUEUED_TIMEOUT_MESSAGE,
        completedAt: now,
        updatedAt: now,
      })
      .where(and(
        eq(hostedDiscoveryRuns.ownerId, ownerId),
        eq(hostedDiscoveryRuns.status, "queued"),
        lt(hostedDiscoveryRuns.createdAt, queuedBefore),
      ))
      .returning({ id: hostedDiscoveryRuns.id });

    const running = await tx
      .update(hostedDiscoveryRuns)
      .set({
        status: "failed",
        errorMessage: HOSTED_DISCOVERY_RUNNING_TIMEOUT_MESSAGE,
        completedAt: now,
        updatedAt: now,
      })
      .where(and(
        eq(hostedDiscoveryRuns.ownerId, ownerId),
        eq(hostedDiscoveryRuns.status, "running"),
        lt(hostedDiscoveryRuns.updatedAt, runningBefore),
      ))
      .returning({ id: hostedDiscoveryRuns.id });

    return { queued: queued.length, running: running.length };
  });
}

export async function setHostedDiscoveryRunMessageId(
  ownerIdValue: string,
  runId: string,
  messageId: string,
) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [run] = await tx
      .update(hostedDiscoveryRuns)
      .set({ messageId, updatedAt: new Date() })
      .where(and(eq(hostedDiscoveryRuns.ownerId, ownerId), eq(hostedDiscoveryRuns.id, runId)))
      .returning();
    return run ?? null;
  });
}

export async function startHostedDiscoveryRun(ownerIdValue: string, runId: string) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [existing] = await tx
      .select()
      .from(hostedDiscoveryRuns)
      .where(and(eq(hostedDiscoveryRuns.ownerId, ownerId), eq(hostedDiscoveryRuns.id, runId)))
      .limit(1);
    if (!existing) return { state: "missing" as const, run: null };
    if (["succeeded", "partial", "failed"].includes(existing.status)) {
      return { state: "complete" as const, run: existing };
    }
    if (existing.status === "running") {
      return { state: "running" as const, run: existing };
    }
    const [run] = await tx
      .update(hostedDiscoveryRuns)
      .set({
        status: "running",
        attempt: sql`${hostedDiscoveryRuns.attempt} + 1`,
        errorMessage: null,
        startedAt: new Date(),
        completedAt: null,
        updatedAt: new Date(),
      })
      .where(and(eq(hostedDiscoveryRuns.ownerId, ownerId), eq(hostedDiscoveryRuns.id, runId)))
      .returning();
    return { state: "started" as const, run };
  });
}

export async function completeHostedDiscoveryRun(
  ownerIdValue: string,
  runId: string,
  result: HostedDiscoveryRunResult,
) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const now = new Date();
    for (const source of result.sourceResults) {
      await tx
        .insert(hostedDiscoverySourceChecks)
        .values({
          ownerId,
          runId,
          source: source.source,
          status: source.error ? "failed" : "healthy",
          fetchedCount: source.jobs.length,
          errorMessage: source.error?.slice(0, 500) || null,
          checkedAt: now,
        })
        .onConflictDoUpdate({
          target: [hostedDiscoverySourceChecks.runId, hostedDiscoverySourceChecks.source],
          set: {
            status: source.error ? "failed" : "healthy",
            fetchedCount: source.jobs.length,
            errorMessage: source.error?.slice(0, 500) || null,
            checkedAt: now,
          },
        });
    }
    const [run] = await tx
      .update(hostedDiscoveryRuns)
      .set({
        status: result.failures.length ? "partial" : "succeeded",
        sourcesChecked: result.sourcesChecked,
        providersSucceeded: result.providersSucceeded,
        fetchedCount: result.fetchedCount,
        qualifiedCount: result.qualifiedCount,
        verificationCount: result.verificationCount,
        rejectedCount: result.rejectedCount,
        savedCount: result.savedCount,
        failureCount: result.failures.length,
        errorMessage: null,
        completedAt: now,
        updatedAt: now,
      })
      .where(and(eq(hostedDiscoveryRuns.ownerId, ownerId), eq(hostedDiscoveryRuns.id, runId)))
      .returning();
    return run ?? null;
  });
}

export async function failHostedDiscoveryRun(ownerIdValue: string, runId: string, error: string) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [run] = await tx
      .update(hostedDiscoveryRuns)
      .set({
        status: "failed",
        errorMessage: error.slice(0, 500),
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(hostedDiscoveryRuns.ownerId, ownerId), eq(hostedDiscoveryRuns.id, runId)))
      .returning();
    return run ?? null;
  });
}

export type HostedDiscoveryRunWithSources = {
  run: HostedDiscoveryRun;
  sources: HostedDiscoverySourceCheck[];
};

export async function getHostedDiscoveryRun(
  ownerIdValue: string,
  runId: string,
): Promise<HostedDiscoveryRunWithSources | null> {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [run] = await tx
      .select()
      .from(hostedDiscoveryRuns)
      .where(and(eq(hostedDiscoveryRuns.ownerId, ownerId), eq(hostedDiscoveryRuns.id, runId)))
      .limit(1);
    if (!run) return null;
    const sources = await tx
      .select()
      .from(hostedDiscoverySourceChecks)
      .where(and(
        eq(hostedDiscoverySourceChecks.ownerId, ownerId),
        eq(hostedDiscoverySourceChecks.runId, runId),
      ))
      .orderBy(hostedDiscoverySourceChecks.source);
    return { run, sources };
  });
}

export async function listHostedDiscoveryRuns(ownerIdValue: string, limitValue = 5) {
  const ownerId = requireTenantId(ownerIdValue);
  await reconcileStaleHostedDiscoveryRuns(ownerId);
  const db = getHostedDatabase();
  const limit = Math.max(1, Math.min(limitValue, 20));
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const runs = await tx
      .select()
      .from(hostedDiscoveryRuns)
      .where(eq(hostedDiscoveryRuns.ownerId, ownerId))
      .orderBy(desc(hostedDiscoveryRuns.createdAt))
      .limit(limit);
    if (!runs.length) return [];
    const output: HostedDiscoveryRunWithSources[] = [];
    for (const run of runs) {
      const sources = await tx
        .select()
        .from(hostedDiscoverySourceChecks)
        .where(and(
          eq(hostedDiscoverySourceChecks.ownerId, ownerId),
          eq(hostedDiscoverySourceChecks.runId, run.id),
        ))
        .orderBy(hostedDiscoverySourceChecks.source);
      output.push({ run, sources });
    }
    return output;
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

export async function getHostedJob(ownerIdValue: string, jobId: string) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [job] = await tx
      .select()
      .from(hostedJobs)
      .where(and(eq(hostedJobs.ownerId, ownerId), eq(hostedJobs.id, jobId)))
      .limit(1);
    return job ?? null;
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

export const HOSTED_PACKET_STATUSES = ["draft", "review", "approved", "archived"] as const;
export type HostedPacketStatus = (typeof HOSTED_PACKET_STATUSES)[number];

function assertPacketStatus(value: string): HostedPacketStatus {
  if (!HOSTED_PACKET_STATUSES.includes(value as HostedPacketStatus)) {
    throw new Error(`Unsupported application packet status: ${value}`);
  }
  return value as HostedPacketStatus;
}

export type HostedApplicationPacketInput = {
  jobId: string;
  resumeId?: string | null;
  resumeArtifactVersionId?: string | null;
  coverLetterVersionId?: string | null;
  atsReportId?: string | null;
  evidenceIds?: string[];
  content: Record<string, unknown>;
  reviewNotes?: string | null;
  status?: HostedPacketStatus;
};

export async function saveHostedAtsReport(ownerIdValue: string, input: {
  jobId: string;
  resumeId: string;
  resumeVersionId: string;
  resumeSha256: string;
  analysis: Record<string, unknown>;
  jobSnapshot: Record<string, unknown>;
}) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [job] = await tx.select({ id: hostedJobs.id }).from(hostedJobs).where(and(eq(hostedJobs.ownerId, ownerId), eq(hostedJobs.id, input.jobId))).limit(1);
    const [resume] = await tx.select({ id: resumeVersions.id }).from(resumeVersions).where(and(eq(resumeVersions.ownerId, ownerId), eq(resumeVersions.id, input.resumeVersionId), eq(resumeVersions.resumeId, input.resumeId))).limit(1);
    if (!job || !resume) throw new Error("The ATS report sources were not found in this workspace.");
    const [report] = await tx.insert(hostedAtsReports).values({ ownerId, ...input }).returning();
    return report;
  });
}

export async function listHostedAtsReports(ownerIdValue: string, jobId?: string) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    return tx.select().from(hostedAtsReports).where(and(eq(hostedAtsReports.ownerId, ownerId), jobId ? eq(hostedAtsReports.jobId, jobId) : sql`true`)).orderBy(desc(hostedAtsReports.createdAt));
  });
}

export async function getVerifiedHostedEvidence(ownerIdValue: string, evidenceIdsValue: string[]) {
  const ownerId = requireTenantId(ownerIdValue);
  const evidenceIds = [...new Set(evidenceIdsValue)];
  if (!evidenceIds.length) return [];
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const evidence = await tx.select().from(hostedEvidenceItems).where(and(
      eq(hostedEvidenceItems.ownerId, ownerId),
      inArray(hostedEvidenceItems.id, evidenceIds),
    ));
    if (evidence.length !== evidenceIds.length || evidence.some((item) => !["verified", "corrected"].includes(item.verificationState))) {
      throw new Error("Drafting can only use verified or corrected evidence from this workspace.");
    }
    return evidenceIds.map((id) => evidence.find((item) => item.id === id)!);
  });
}

export async function countHostedModelUsageSince(ownerIdValue: string, since: Date) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [row] = await tx.select({ count: sql<number>`count(*)::int` }).from(hostedModelUsage).where(and(
      eq(hostedModelUsage.ownerId, ownerId),
      sql`${hostedModelUsage.createdAt} >= ${since}`,
    ));
    return row?.count || 0;
  });
}

export async function recordHostedModelUsage(ownerIdValue: string, input: {
  provider: string;
  model: string;
  requestKind: string;
  inputCharacters: number;
  outputCharacters: number;
  costMicros?: number;
}) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [usage] = await tx.insert(hostedModelUsage).values({ ownerId, ...input, costMicros: input.costMicros || 0 }).returning();
    return usage;
  });
}

export async function saveHostedApplicationPacket(
  ownerIdValue: string,
  input: HostedApplicationPacketInput,
) {
  const ownerId = requireTenantId(ownerIdValue);
  await ensureHostedUser(ownerId);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [job] = await tx
      .select()
      .from(hostedJobs)
      .where(and(eq(hostedJobs.ownerId, ownerId), eq(hostedJobs.id, input.jobId)))
      .limit(1);
    if (!job) throw new Error("Job not found in this workspace.");

    if (input.resumeId) {
      const [resume] = await tx
        .select({ id: resumes.id })
        .from(resumes)
        .where(and(eq(resumes.ownerId, ownerId), eq(resumes.id, input.resumeId)))
        .limit(1);
      if (!resume) throw new Error("Resume not found in this workspace.");
    }

    async function requireArtifactVersion(versionId: string | null | undefined, expectedKind: "resume" | "cover-letter") {
      if (!versionId) return null;
      const [record] = await tx
        .select({ version: hostedArtifactVersions, artifact: hostedArtifacts })
        .from(hostedArtifactVersions)
        .innerJoin(hostedArtifacts, and(
          eq(hostedArtifacts.id, hostedArtifactVersions.artifactId),
          eq(hostedArtifacts.ownerId, ownerId),
        ))
        .where(and(eq(hostedArtifactVersions.ownerId, ownerId), eq(hostedArtifactVersions.id, versionId)))
        .limit(1);
      if (!record || record.artifact.kind !== expectedKind) {
        throw new Error(`The selected ${expectedKind} version was not found in this workspace.`);
      }
      return record;
    }
    const resumeArtifact = await requireArtifactVersion(input.resumeArtifactVersionId, "resume");
    const coverLetter = await requireArtifactVersion(input.coverLetterVersionId, "cover-letter");
    let atsReport = null;
    if (input.atsReportId) {
      [atsReport] = await tx
        .select()
        .from(hostedAtsReports)
        .where(and(
          eq(hostedAtsReports.ownerId, ownerId),
          eq(hostedAtsReports.id, input.atsReportId),
          eq(hostedAtsReports.jobId, job.id),
        ))
        .limit(1);
      if (!atsReport) throw new Error("The selected ATS report was not found for this job.");
    }

    const evidenceIds = [...new Set(input.evidenceIds || [])];
    const evidence = evidenceIds.length
      ? await tx
          .select({
            id: hostedEvidenceItems.id,
            title: hostedEvidenceItems.title,
            verificationState: hostedEvidenceItems.verificationState,
          })
          .from(hostedEvidenceItems)
          .where(and(
            eq(hostedEvidenceItems.ownerId, ownerId),
            inArray(hostedEvidenceItems.id, evidenceIds),
          ))
      : [];
    if (evidence.length !== evidenceIds.length) {
      throw new Error("One or more evidence items were not found in this workspace.");
    }
    if (evidence.some((item) => !["verified", "corrected"].includes(item.verificationState))) {
      throw new Error("Application packets can only pin verified or corrected evidence.");
    }

    const status = assertPacketStatus(input.status || "draft");
    if (status === "approved" && evidenceIds.length === 0) {
      throw new Error("Pin at least one verified evidence item before approving this packet.");
    }
    if (status === "approved" && (!resumeArtifact || !coverLetter || !atsReport)) {
      throw new Error("Approved packets require an exact resume version, cover-letter version, and ATS report.");
    }
    const sourceSnapshot = {
      job: {
        id: job.id,
        company: job.company,
        title: job.title,
        url: job.url,
        location: job.location,
        descriptionExcerpt: job.descriptionExcerpt,
        compensationMinimum: job.compensationMinimum,
        compensationMaximum: job.compensationMaximum,
        sponsorshipSignal: job.sponsorshipSignal,
      },
      resumeArtifact: resumeArtifact ? {
        artifactId: resumeArtifact.artifact.id,
        versionId: resumeArtifact.version.id,
        version: resumeArtifact.version.version,
        contentSha256: resumeArtifact.version.contentSha256,
      } : null,
      coverLetter: coverLetter ? {
        artifactId: coverLetter.artifact.id,
        versionId: coverLetter.version.id,
        version: coverLetter.version.version,
        contentSha256: coverLetter.version.contentSha256,
      } : null,
      atsReport: atsReport ? {
        id: atsReport.id,
        resumeSha256: atsReport.resumeSha256,
        createdAt: atsReport.createdAt.toISOString(),
      } : null,
      capturedAt: new Date().toISOString(),
    };
    const now = new Date();
    const approvalFingerprint = status === "approved" ? packetApprovalFingerprint(packetApprovalPayload({
      jobId: job.id,
      resumeId: input.resumeId || null,
      resumeArtifactVersionId: input.resumeArtifactVersionId || null,
      coverLetterVersionId: input.coverLetterVersionId || null,
      atsReportId: input.atsReportId || null,
      evidenceIds,
      sourceSnapshot,
      content: input.content,
    })) : null;
    const [packet] = await tx
      .insert(hostedApplicationPackets)
      .values({
        ownerId,
        jobId: job.id,
        resumeId: input.resumeId || null,
        resumeArtifactVersionId: input.resumeArtifactVersionId || null,
        coverLetterVersionId: input.coverLetterVersionId || null,
        atsReportId: input.atsReportId || null,
        approvalFingerprint,
        status,
        sourceSnapshot,
        content: input.content,
        reviewNotes: input.reviewNotes?.trim().slice(0, 2_000) || null,
        approvedAt: status === "approved" ? now : null,
      })
      .onConflictDoUpdate({
        target: [hostedApplicationPackets.ownerId, hostedApplicationPackets.jobId],
        set: {
          resumeId: input.resumeId || null,
          resumeArtifactVersionId: input.resumeArtifactVersionId || null,
          coverLetterVersionId: input.coverLetterVersionId || null,
          atsReportId: input.atsReportId || null,
          approvalFingerprint,
          status,
          sourceSnapshot,
          content: input.content,
          reviewNotes: input.reviewNotes?.trim().slice(0, 2_000) || null,
          approvedAt: status === "approved" ? now : null,
          updatedAt: now,
        },
      })
      .returning();
    await tx
      .delete(hostedEvidenceUsages)
      .where(and(
        eq(hostedEvidenceUsages.ownerId, ownerId),
        eq(hostedEvidenceUsages.surfaceType, "application-packet"),
        eq(hostedEvidenceUsages.surfaceId, packet.id),
      ));
    if (evidenceIds.length) {
      await tx.insert(hostedEvidenceUsages).values(evidence.map((item) => ({
        ownerId,
        evidenceId: item.id,
        surfaceType: "application-packet",
        surfaceId: packet.id,
        surfaceLabel: `${job.company} — ${job.title}`,
      })));
    }
    await tx.insert(hostedApplicationPacketEvents).values({
      ownerId,
      packetId: packet.id,
      event: status,
      details: {
        jobId: job.id,
        resumeId: input.resumeId || null,
        resumeArtifactVersionId: input.resumeArtifactVersionId || null,
        coverLetterVersionId: input.coverLetterVersionId || null,
        atsReportId: input.atsReportId || null,
        approvalFingerprint,
        evidenceCount: evidenceIds.length,
      },
    });
    return packet;
  });
}

export async function listHostedApplicationPackets(ownerIdValue: string) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const packets = await tx
      .select({
        packet: hostedApplicationPackets,
        job: hostedJobs,
        resumeName: resumes.name,
      })
      .from(hostedApplicationPackets)
      .innerJoin(
        hostedJobs,
        and(
          eq(hostedJobs.id, hostedApplicationPackets.jobId),
          eq(hostedJobs.ownerId, ownerId),
        ),
      )
      .leftJoin(
        resumes,
        and(
          eq(resumes.id, hostedApplicationPackets.resumeId),
          eq(resumes.ownerId, ownerId),
        ),
      )
      .where(eq(hostedApplicationPackets.ownerId, ownerId))
      .orderBy(desc(hostedApplicationPackets.updatedAt));
    if (!packets.length) return [];
    const usages = await tx
      .select({ evidenceId: hostedEvidenceUsages.evidenceId, surfaceId: hostedEvidenceUsages.surfaceId })
      .from(hostedEvidenceUsages)
      .where(and(
        eq(hostedEvidenceUsages.ownerId, ownerId),
        eq(hostedEvidenceUsages.surfaceType, "application-packet"),
        inArray(hostedEvidenceUsages.surfaceId, packets.map((item) => item.packet.id)),
      ));
    const evidenceByPacket = new Map<string, string[]>();
    for (const usage of usages) {
      const current = evidenceByPacket.get(usage.surfaceId) || [];
      current.push(usage.evidenceId);
      evidenceByPacket.set(usage.surfaceId, current);
    }
    return packets.map((item) => ({
      ...item,
      evidenceIds: evidenceByPacket.get(item.packet.id) || [],
    }));
  });
}

export async function getHostedApplicationPacket(ownerIdValue: string, packetId: string) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [packet] = await tx
      .select({ packet: hostedApplicationPackets, job: hostedJobs, resumeName: resumes.name })
      .from(hostedApplicationPackets)
      .innerJoin(
        hostedJobs,
        and(eq(hostedJobs.id, hostedApplicationPackets.jobId), eq(hostedJobs.ownerId, ownerId)),
      )
      .leftJoin(
        resumes,
        and(eq(resumes.id, hostedApplicationPackets.resumeId), eq(resumes.ownerId, ownerId)),
      )
      .where(and(
        eq(hostedApplicationPackets.ownerId, ownerId),
        eq(hostedApplicationPackets.id, packetId),
      ))
      .limit(1);
    if (!packet) return null;
    const usages = await tx
      .select({ evidenceId: hostedEvidenceUsages.evidenceId })
      .from(hostedEvidenceUsages)
      .where(and(
        eq(hostedEvidenceUsages.ownerId, ownerId),
        eq(hostedEvidenceUsages.surfaceType, "application-packet"),
        eq(hostedEvidenceUsages.surfaceId, packet.packet.id),
      ));
    return { ...packet, evidenceIds: usages.map((usage) => usage.evidenceId) };
  });
}

export type HostedAutomationScheduleInput = {
  enabled: boolean;
  cadence: "daily" | "twice-daily" | "weekly";
  localTime: string;
  timezone: string;
  qstashScheduleId?: string | null;
  nextRunAt?: Date | null;
  lastError?: string | null;
};

export async function getHostedAutomationSchedule(ownerIdValue: string) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [schedule] = await tx
      .select()
      .from(hostedAutomationSchedules)
      .where(eq(hostedAutomationSchedules.ownerId, ownerId))
      .limit(1);
    return schedule ?? null;
  });
}

export async function saveHostedAutomationSchedule(
  ownerIdValue: string,
  input: HostedAutomationScheduleInput,
) {
  const ownerId = requireTenantId(ownerIdValue);
  await ensureHostedUser(ownerId);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [schedule] = await tx
      .insert(hostedAutomationSchedules)
      .values({ ownerId, ...input })
      .onConflictDoUpdate({
        target: hostedAutomationSchedules.ownerId,
        set: { ...input, updatedAt: new Date() },
      })
      .returning();
    return schedule;
  });
}

export async function listHostedSourcePreferences(ownerIdValue: string) {
  const ownerId = requireTenantId(ownerIdValue);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    return tx
      .select()
      .from(hostedSourcePreferences)
      .where(eq(hostedSourcePreferences.ownerId, ownerId))
      .orderBy(hostedSourcePreferences.sourceKey);
  });
}

export async function saveHostedSourcePreference(
  ownerIdValue: string,
  sourceKey: string,
  enabled: boolean,
) {
  const ownerId = requireTenantId(ownerIdValue);
  await ensureHostedUser(ownerId);
  const db = getHostedDatabase();
  return db.transaction(async (tx) => {
    await setTenant(tx, ownerId);
    const [preference] = await tx
      .insert(hostedSourcePreferences)
      .values({ ownerId, sourceKey, enabled })
      .onConflictDoUpdate({
        target: [hostedSourcePreferences.ownerId, hostedSourcePreferences.sourceKey],
        set: { enabled, updatedAt: new Date() },
      })
      .returning();
    return preference;
  });
}
