import type { Metadata } from "next";

import { ResumeLibrary } from "@/components/hosted/resume-library";

export const metadata: Metadata = {
  title: "Resumes — RoleLinked",
  description: "Manage private, role-specific resume sources and versions.",
};

export default async function ResumesPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;
  return <ResumeLibrary fromOnboarding={params.returnTo === "onboarding"} />;
}
