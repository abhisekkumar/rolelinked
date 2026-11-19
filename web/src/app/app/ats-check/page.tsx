import type { Metadata } from "next";
import { Suspense } from "react";

import { AtsResumeChecker } from "@/components/hosted/ats-resume-checker";

export const metadata: Metadata = {
  title: "ATS Resume Check — RoleLinked",
  description: "Privately compare a saved resume with a job using evidence-bound ATS compatibility checks.",
};

export default function AtsCheckPage() {
  return <Suspense><AtsResumeChecker /></Suspense>;
}
