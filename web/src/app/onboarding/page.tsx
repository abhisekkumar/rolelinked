import type { Metadata } from "next";

import { OnboardingExperience } from "@/components/hosted/onboarding-experience";

export const metadata: Metadata = {
  title: "Set up your RoleLinked workspace",
  description: "Define your target roles, resume library, and approval-first search automation.",
};

export default function OnboardingPage() {
  return <OnboardingExperience />;
}
