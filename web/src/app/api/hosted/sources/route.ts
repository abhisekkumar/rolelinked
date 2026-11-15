import { NextResponse } from "next/server";

import {
  listHostedSourcePreferences,
  saveHostedSourcePreference,
} from "@/lib/hosted/db/repository";
import { HOSTED_SOURCE_CATALOG } from "@/lib/hosted/discovery-sources";
import { requireHostedUserId } from "@/lib/hosted/identity";
import { hostedSourcePreferenceSchema } from "@/lib/hosted/profile-schema";

export async function GET() {
  try {
    const ownerId = await requireHostedUserId();
    const preferences = await listHostedSourcePreferences(ownerId);
    const byKey = new Map(preferences.map((item) => [item.sourceKey, item.enabled]));
    return NextResponse.json({
      sources: HOSTED_SOURCE_CATALOG.map((item) => ({ ...item, enabled: byKey.get(item.key) ?? true })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load sources.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const ownerId = await requireHostedUserId();
    const parsed = hostedSourcePreferenceSchema.safeParse(await request.json());
    if (!parsed.success || !HOSTED_SOURCE_CATALOG.some((item) => item.key === parsed.data.sourceKey)) {
      return NextResponse.json({ error: "Unknown source preference." }, { status: 400 });
    }
    const preference = await saveHostedSourcePreference(ownerId, parsed.data.sourceKey, parsed.data.enabled);
    return NextResponse.json({ preference });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update the source.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}
