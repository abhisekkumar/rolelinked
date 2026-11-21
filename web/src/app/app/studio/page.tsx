import type { Metadata } from "next";

import { ArtifactStudio } from "@/components/hosted/artifact-studio";

export const metadata: Metadata = {
  title: "Document Studio — RoleLinked",
  description: "Create source-backed, versioned resumes and cover letters.",
};

export default function StudioPage() {
  return <ArtifactStudio />;
}
