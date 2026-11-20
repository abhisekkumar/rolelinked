import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OnboardingExperience } from "@/components/hosted/onboarding-experience";
import { isHostedDatabaseConfigured } from "@/lib/hosted/config.mjs";
import { getHostedProfile } from "@/lib/hosted/db/repository";
import { getHostedIdentity } from "@/lib/hosted/identity";

export const metadata: Metadata = {
  title: "Set up your RoleLinked workspace",
  description: "Define your target roles, resume library, and approval-first search automation.",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; mode?: string }>;
}) {
  const identity = await getHostedIdentity();
  if (!identity) redirect("/sign-in");
  const params = await searchParams;
  const editing = params.mode === "edit";
  let onboardingComplete = false;

  if (identity.mode === "clerk" && !editing && isHostedDatabaseConfigured()) {
    try {
      const profile = await getHostedProfile(identity.userId);
      onboardingComplete = Boolean(profile.user?.onboardingComplete);
    } catch {
      // Keep setup reachable when profile storage is temporarily unavailable;
      // the form already reports persistence failures without losing input.
    }
  }
  if (onboardingComplete) redirect("/app/today");

  const initialStep = params.step === "resumes" ? 1 : 0;

  return <OnboardingExperience persistent={identity.mode === "clerk"} initialStep={initialStep} editing={editing} />;
}
