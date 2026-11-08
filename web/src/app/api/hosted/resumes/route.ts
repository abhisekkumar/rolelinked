import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { isHostedDatabaseConfigured } from "@/lib/hosted/config.mjs";
import { describePrivateUploadError } from "@/lib/hosted/blob-errors.mjs";
import {
  createHostedResume,
  listHostedResumes,
} from "@/lib/hosted/db/repository";
import { requireHostedUserId } from "@/lib/hosted/identity";
import {
  deletePrivateObject,
  isPrivateObjectStoreConfigured,
  uploadPrivateResume,
} from "@/lib/hosted/object-store";
import { hostedResumeMetadataSchema } from "@/lib/hosted/profile-schema";

export const maxDuration = 60;

function unavailable() {
  return NextResponse.json(
    { error: "Resume storage is not configured yet." },
    { status: 503 },
  );
}

export async function GET() {
  try {
    const ownerId = await requireHostedUserId();
    if (!isHostedDatabaseConfigured()) return unavailable();
    const resumes = await listHostedResumes(ownerId);
    return NextResponse.json({ resumes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to list resumes.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  let uploadedPathname: string | null = null;
  try {
    const ownerId = await requireHostedUserId();
    if (!isHostedDatabaseConfigured() || !isPrivateObjectStoreConfigured()) return unavailable();
    const form = await request.formData();
    const metadata = hostedResumeMetadataSchema.safeParse({
      name: form.get("name"),
      roleType: form.get("roleType"),
    });
    const file = form.get("file");
    if (!metadata.success || !(file instanceof File)) {
      return NextResponse.json({ error: "A name, role type, and resume file are required." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const sha256 = createHash("sha256").update(Buffer.from(bytes)).digest("hex");
    const blob = await uploadPrivateResume(ownerId, file);
    uploadedPathname = blob.pathname;
    const record = await createHostedResume(ownerId, {
      ...metadata.data,
      storageKey: blob.pathname,
      originalFilename: file.name,
      contentType: blob.contentType,
      byteSize: file.size,
      sha256,
    });
    return NextResponse.json({ created: true, resume: record.resume, version: record.version }, { status: 201 });
  } catch (error) {
    if (uploadedPathname) {
      try {
        await deletePrivateObject(uploadedPathname);
      } catch {
        // Preserve the original failure. Storage reconciliation will remove an
        // orphan if the database write failed after a successful upload.
      }
    }
    const message = error instanceof Error ? error.message : "Unable to upload the resume.";
    if (message === "Authentication required.") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    const described = describePrivateUploadError(error);
    return NextResponse.json({ error: described.message }, { status: described.status });
  }
}
