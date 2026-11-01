import type { Metadata } from "next";

import { ResumeLibrary } from "@/components/hosted/resume-library";

export const metadata: Metadata = {
  title: "Resumes — RoleLinked",
  description: "Manage private, role-specific resume sources and versions.",
};

export default function ResumesPage() {
  return <ResumeLibrary />;
}
