import { NextResponse } from "next/server";

import { listHostedArtifacts, saveHostedArtifactVersion } from "@/lib/hosted/db/repository";
import { requireHostedUserId } from "@/lib/hosted/identity";
import { hostedArtifactVersionSchema } from "@/lib/hosted/profile-schema";

export async function GET(request: Request) {
  try {
    const ownerId = await requireHostedUserId();
    const value = new URL(request.url).searchParams.get("kind");
    const kind = value === "resume" || value === "cover-letter" ? value : undefined;
    return NextResponse.json({ artifacts: await listHostedArtifacts(ownerId, { kind }) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load the document studio.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ownerId = await requireHostedUserId();
    const parsed = hostedArtifactVersionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Check the artifact and its evidence links.", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const saved = await saveHostedArtifactVersion(ownerId, parsed.data);
    return NextResponse.json({ saved: true, ...saved }, { status: parsed.data.artifactId ? 200 : 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save this artifact version.";
    const status = message === "Authentication required." ? 401 : /not found|verified|source|claim/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
