import { NextResponse } from "next/server";

import {
  deleteHostedResumeRecord,
  getHostedResumeVersion,
} from "@/lib/hosted/db/repository";
import { requireHostedUserId } from "@/lib/hosted/identity";
import { deletePrivateObject } from "@/lib/hosted/object-store";

type ResumeRouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: ResumeRouteContext) {
  try {
    const ownerId = await requireHostedUserId();
    const { id } = await context.params;
    const record = await getHostedResumeVersion(ownerId, id);
    if (!record) return NextResponse.json({ error: "Resume not found." }, { status: 404 });
    await deletePrivateObject(record.version.storageKey);
    const deleted = await deleteHostedResumeRecord(ownerId, id);
    if (deleted.length === 0) return NextResponse.json({ error: "Resume not found." }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete the resume.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}
