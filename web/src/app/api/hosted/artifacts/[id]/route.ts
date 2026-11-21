import { NextResponse } from "next/server";

import { archiveHostedArtifact, getHostedArtifact } from "@/lib/hosted/db/repository";
import { requireHostedUserId } from "@/lib/hosted/identity";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const ownerId = await requireHostedUserId();
    const { id } = await context.params;
    const artifact = await getHostedArtifact(ownerId, id);
    return artifact
      ? NextResponse.json(artifact)
      : NextResponse.json({ error: "Artifact not found." }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load this artifact.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const ownerId = await requireHostedUserId();
    const { id } = await context.params;
    const archived = await archiveHostedArtifact(ownerId, id);
    return archived.length
      ? NextResponse.json({ archived: true })
      : NextResponse.json({ error: "Artifact not found." }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to archive this artifact.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}
