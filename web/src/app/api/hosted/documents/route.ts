import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { isHostedDatabaseConfigured } from "@/lib/hosted/config.mjs";
import { describePrivateUploadError } from "@/lib/hosted/blob-errors.mjs";
import { createHostedDocument, listHostedDocuments } from "@/lib/hosted/db/repository";
import { requireHostedUserId } from "@/lib/hosted/identity";
import {
  deletePrivateObject,
  isPrivateObjectStoreConfigured,
  uploadPrivateDocument,
} from "@/lib/hosted/object-store";
import { hostedDocumentMetadataSchema } from "@/lib/hosted/profile-schema";

export const maxDuration = 60;

export async function GET() {
  try {
    const ownerId = await requireHostedUserId();
    if (!isHostedDatabaseConfigured()) {
      return NextResponse.json({ error: "Document storage is not configured yet." }, { status: 503 });
    }
    return NextResponse.json({ documents: await listHostedDocuments(ownerId) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to list documents.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  let uploadedPathname: string | null = null;
  try {
    const ownerId = await requireHostedUserId();
    if (!isHostedDatabaseConfigured() || !isPrivateObjectStoreConfigured()) {
      return NextResponse.json({ error: "Document storage is not configured yet." }, { status: 503 });
    }
    const form = await request.formData();
    const metadata = hostedDocumentMetadataSchema.safeParse({
      title: form.get("title"),
      kind: form.get("kind"),
    });
    const file = form.get("file");
    if (!metadata.success || !(file instanceof File)) {
      return NextResponse.json({ error: "A title, document type, and file are required." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const sha256 = createHash("sha256").update(Buffer.from(bytes)).digest("hex");
    const blob = await uploadPrivateDocument(ownerId, file);
    uploadedPathname = blob.pathname;
    const document = await createHostedDocument(ownerId, {
      ...metadata.data,
      storageKey: blob.pathname,
      originalFilename: file.name,
      contentType: blob.contentType,
      byteSize: file.size,
      sha256,
    });
    return NextResponse.json({ created: true, document }, { status: 201 });
  } catch (error) {
    if (uploadedPathname) {
      try { await deletePrivateObject(uploadedPathname); } catch { /* preserve original failure */ }
    }
    const message = error instanceof Error ? error.message : "Unable to upload the document.";
    if (message === "Authentication required.") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    const described = describePrivateUploadError(error);
    return NextResponse.json({ error: described.message }, { status: described.status });
  }
}
