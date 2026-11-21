import { createHash } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import {
  appendHostedResumeVersion,
  deleteHostedResumeRecord,
  getHostedResumeVersion,
  listHostedResumeStorageKeys,
  updateHostedResumeMetadata,
} from "@/lib/hosted/db/repository";
import { requireHostedUserId } from "@/lib/hosted/identity";
import { deletePrivateObject, uploadPrivateResume } from "@/lib/hosted/object-store";

type ResumeRouteContext = { params: Promise<{ id: string }> };

const metadataSchema = z.object({ name: z.string().trim().min(1).max(100), roleType: z.string().trim().min(1).max(100) }).strict();

export async function PATCH(request: Request, context: ResumeRouteContext) {
  let uploadedPathname: string | null = null;
  try {
    const ownerId = await requireHostedUserId();
    const { id } = await context.params;
    const current = await getHostedResumeVersion(ownerId, id);
    if (!current) return NextResponse.json({ error: "Resume not found." }, { status: 404 });
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return NextResponse.json({ error: "Choose a replacement resume file." }, { status: 400 });
      const bytes = await file.arrayBuffer();
      const blob = await uploadPrivateResume(ownerId, file);
      uploadedPathname = blob.pathname;
      const version = await appendHostedResumeVersion(ownerId, id, {
        storageKey: blob.pathname,
        originalFilename: file.name,
        contentType: blob.contentType,
        byteSize: file.size,
        sha256: createHash("sha256").update(Buffer.from(bytes)).digest("hex"),
      });
      if (!version) throw new Error("Resume not found.");
      return NextResponse.json({ replaced: true, version });
    }
    const parsed = metadataSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "A resume name and role family are required." }, { status: 400 });
    const resume = await updateHostedResumeMetadata(ownerId, id, parsed.data);
    return resume ? NextResponse.json({ updated: true, resume }) : NextResponse.json({ error: "Resume not found." }, { status: 404 });
  } catch (error) {
    if (uploadedPathname) try { await deletePrivateObject(uploadedPathname); } catch { /* reconciliation can retry */ }
    const message = error instanceof Error ? error.message : "Unable to update the resume.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}

export async function DELETE(_request: Request, context: ResumeRouteContext) {
  try {
    const ownerId = await requireHostedUserId();
    const { id } = await context.params;
    const records = await listHostedResumeStorageKeys(ownerId, id);
    if (!records.length) return NextResponse.json({ error: "Resume not found." }, { status: 404 });
    await Promise.all(records.map((record) => deletePrivateObject(record.storageKey)));
    const deleted = await deleteHostedResumeRecord(ownerId, id);
    if (deleted.length === 0) return NextResponse.json({ error: "Resume not found." }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete the resume.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}
