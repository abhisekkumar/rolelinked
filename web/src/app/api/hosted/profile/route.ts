import { NextResponse } from "next/server";

import { isHostedDatabaseConfigured } from "@/lib/hosted/config.mjs";
import {
  ensureHostedUser,
  getHostedProfile,
  saveHostedSearchProfile,
} from "@/lib/hosted/db/repository";
import { requireHostedUserId } from "@/lib/hosted/identity";
import { hostedSearchProfileSchema } from "@/lib/hosted/profile-schema";

function unavailable() {
  return NextResponse.json(
    { error: "Profile storage is not configured yet." },
    { status: 503 },
  );
}

export async function GET() {
  try {
    const ownerId = await requireHostedUserId();
    if (!isHostedDatabaseConfigured()) return unavailable();
    await ensureHostedUser(ownerId);
    const profile = await getHostedProfile(ownerId);
    return NextResponse.json({
      onboardingComplete: profile.user?.onboardingComplete ?? false,
      search: profile.search,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load the profile.";
    const status = message === "Authentication required." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: Request) {
  try {
    const ownerId = await requireHostedUserId();
    if (!isHostedDatabaseConfigured()) return unavailable();
    const payload = hostedSearchProfileSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json(
        { error: "Check the highlighted profile fields.", issues: payload.error.flatten() },
        { status: 400 },
      );
    }
    const search = await saveHostedSearchProfile(ownerId, payload.data);
    return NextResponse.json({ saved: true, search });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save the profile.";
    const status = message === "Authentication required." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
