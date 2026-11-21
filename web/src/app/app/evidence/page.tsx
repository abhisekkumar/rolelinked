import type { Metadata } from "next";

import { EvidenceVault } from "@/components/hosted/evidence-vault";

export const metadata: Metadata = {
  title: "Evidence Vault — RoleLinked",
  description: "Review and manage source-backed career evidence.",
};

export default function EvidencePage() {
  return <EvidenceVault />;
}
