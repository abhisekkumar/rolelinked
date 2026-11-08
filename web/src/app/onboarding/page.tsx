import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OnboardingExperience } from "@/components/hosted/onboarding-experience";
import { getHostedIdentity } from "@/lib/hosted/identity";

export const metadata: Metadata = {
  title: "Set up your RoleLinked workspace",
  description: "Define your target roles, resume library, and approval-first search automation.",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const identity = await getHostedIdentity();
  if (!identity) redirect("/sign-in");
  const params = await searchParams;
  const initialStep = params.step === "resumes" ? 1 : 0;

  return <OnboardingExperience persistent={identity.mode === "clerk"} initialStep={initialStep} />;
}
