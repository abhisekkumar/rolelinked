import { createHash } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { deleteHostedDocumentRecord, getHostedDocument, updateHostedDocument } from "@/lib/hosted/db/repository";
import { requireHostedUserId } from "@/lib/hosted/identity";
import { deletePrivateObject, uploadPrivateDocument } from "@/lib/hosted/object-store";

type Context = { params: Promise<{ id: string }> };
const renameSchema = z.object({ title: z.string().trim().min(1).max(120), kind: z.string().trim().min(1).max(50) }).strict();

export async function PATCH(request: Request, context: Context) {
  let uploadedPathname: string | null = null;
  try {
    const ownerId = await requireHostedUserId();
    const { id } = await context.params;
    const current = await getHostedDocument(ownerId, id);
    if (!current) return NextResponse.json({ error: "Document not found." }, { status: 404 });
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return NextResponse.json({ error: "Choose a replacement document." }, { status: 400 });
      const bytes = await file.arrayBuffer();
      const blob = await uploadPrivateDocument(ownerId, file);
      uploadedPathname = blob.pathname;
      const document = await updateHostedDocument(ownerId, id, {
        storageKey: blob.pathname,
        originalFilename: file.name,
        contentType: blob.contentType,
        byteSize: file.size,
        sha256: createHash("sha256").update(Buffer.from(bytes)).digest("hex"),
      });
      if (!document) throw new Error("Document not found.");
      try { await deletePrivateObject(current.storageKey); } catch { /* old object is inaccessible and can be reconciled */ }
      return NextResponse.json({ replaced: true, document });
    }
    const parsed = renameSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "A title and document type are required." }, { status: 400 });
    const document = await updateHostedDocument(ownerId, id, parsed.data);
    return document ? NextResponse.json({ updated: true, document }) : NextResponse.json({ error: "Document not found." }, { status: 404 });
  } catch (error) {
    if (uploadedPathname) try { await deletePrivateObject(uploadedPathname); } catch { /* reconciliation can retry */ }
    const message = error instanceof Error ? error.message : "Unable to update the document.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const ownerId = await requireHostedUserId();
    const { id } = await context.params;
    const document = await getHostedDocument(ownerId, id);
    if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
    await deletePrivateObject(document.storageKey);
    const deleted = await deleteHostedDocumentRecord(ownerId, id);
    return deleted.length
      ? NextResponse.json({ deleted: true })
      : NextResponse.json({ error: "Document not found." }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete the document.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}
