import { NextResponse } from "next/server";

import { deleteHostedDocumentRecord, getHostedDocument } from "@/lib/hosted/db/repository";
import { requireHostedUserId } from "@/lib/hosted/identity";
import { deletePrivateObject } from "@/lib/hosted/object-store";

type Context = { params: Promise<{ id: string }> };

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
