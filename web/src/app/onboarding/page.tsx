import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OnboardingExperience } from "@/components/hosted/onboarding-experience";
import { getHostedIdentity } from "@/lib/hosted/identity";

export const metadata: Metadata = {
  title: "Set up your RoleLinked workspace",
  description: "Define your target roles, resume library, and approval-first search automation.",
};

export default async function OnboardingPage() {
  const identity = await getHostedIdentity();
  if (!identity) redirect("/sign-in");

  return <OnboardingExperience />;
}
