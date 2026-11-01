import type { Metadata } from "next";
import { WelcomeExperience } from "@/components/marketing/welcome-experience";

export const metadata: Metadata = {
  title: "RoleLinked — run your job search like a system",
  description:
    "Discover relevant roles, tailor from verified experience, track every application, and prepare for interviews in one calm workspace.",
  openGraph: {
    title: "RoleLinked — run your job search like a system",
    description:
      "A connected workspace for discovery, truthful application preparation, pipeline tracking, and interview practice.",
    type: "website",
  },
};

export default function WelcomePage() {
  return <WelcomeExperience />;
}
