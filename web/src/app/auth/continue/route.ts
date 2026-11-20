import { NextResponse } from "next/server";

import { isHostedDatabaseConfigured } from "@/lib/hosted/config.mjs";
import { getHostedProfile } from "@/lib/hosted/db/repository";
import { getHostedIdentity } from "@/lib/hosted/identity";
import { hostedPostAuthDestination } from "@/lib/hosted/post-auth-destination.mjs";

export async function GET(request: Request) {
  const identity = await getHostedIdentity();
  if (!identity) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("redirect_url", "/auth/continue");
    return NextResponse.redirect(signIn);
  }

  const databaseConfigured = isHostedDatabaseConfigured();
  let profileAvailable = true;
  let onboardingComplete = false;

  if (identity.mode === "clerk" && databaseConfigured) {
    try {
      const profile = await getHostedProfile(identity.userId);
      onboardingComplete = Boolean(profile.user?.onboardingComplete);
    } catch {
      profileAvailable = false;
    }
  }

  const destination = hostedPostAuthDestination({
    identityMode: identity.mode,
    databaseConfigured,
    profileAvailable,
    onboardingComplete,
  });
  return NextResponse.redirect(new URL(destination, request.url));
}
