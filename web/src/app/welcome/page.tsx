import type { Metadata } from "next";
import { WelcomeExperience } from "@/components/marketing/welcome-experience";
import { getHostedIdentity } from "@/lib/hosted/identity";

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

export default async function WelcomePage() {
  const identity = await getHostedIdentity();
  return <WelcomeExperience signedIn={identity?.mode === "clerk"} />;
}
