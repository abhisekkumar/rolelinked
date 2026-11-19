import { NextResponse } from "next/server";

import { decideHostedEvidence, deleteHostedEvidence, getHostedEvidenceItem } from "@/lib/hosted/db/repository";
import { requireHostedUserId } from "@/lib/hosted/identity";
import { hostedEvidenceDecisionSchema } from "@/lib/hosted/profile-schema";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const ownerId = await requireHostedUserId();
    const { id } = await context.params;
    const current = await getHostedEvidenceItem(ownerId, id);
    if (!current) return NextResponse.json({ error: "Evidence item not found." }, { status: 404 });
    const parsed = hostedEvidenceDecisionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Choose a valid evidence decision." }, { status: 400 });
    }
    const evidence = await decideHostedEvidence(ownerId, id, parsed.data);
    return NextResponse.json({ saved: true, evidence });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to review the evidence item.";
    const status = message === "Authentication required." ? 401 : message.includes("durable") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const ownerId = await requireHostedUserId();
    const { id } = await context.params;
    const deleted = await deleteHostedEvidence(ownerId, id);
    return deleted.length
      ? NextResponse.json({ deleted: true })
      : NextResponse.json({ error: "Evidence item not found." }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete the evidence item.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}
