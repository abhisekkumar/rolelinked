import { NextResponse } from "next/server";

import { isHostedDatabaseConfigured } from "@/lib/hosted/config.mjs";
import { createHostedEvidence, listHostedEvidence } from "@/lib/hosted/db/repository";
import { requireHostedUserId } from "@/lib/hosted/identity";
import { hostedEvidenceItemSchema } from "@/lib/hosted/profile-schema";

function unavailable() {
  return NextResponse.json({ error: "Evidence storage is not configured yet." }, { status: 503 });
}

export async function GET() {
  try {
    const ownerId = await requireHostedUserId();
    if (!isHostedDatabaseConfigured()) return unavailable();
    return NextResponse.json({ evidence: await listHostedEvidence(ownerId) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load the Evidence Vault.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ownerId = await requireHostedUserId();
    if (!isHostedDatabaseConfigured()) return unavailable();
    const parsed = hostedEvidenceItemSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Check the evidence statement and its source.", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const evidence = await createHostedEvidence(ownerId, parsed.data);
    return NextResponse.json({ created: true, evidence }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add the evidence item.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}
