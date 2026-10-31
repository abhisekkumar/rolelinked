import type { Metadata } from "next";

import { IntegrationsView } from "@/components/hosted/integrations-view";
import { getHostedServiceReadiness } from "@/lib/hosted/config.mjs";

export const metadata: Metadata = {
  title: "Integrations — RoleLinked",
  description: "Review the services connected to your hosted RoleLinked workspace.",
};

export default function IntegrationsPage() {
  return <IntegrationsView readiness={getHostedServiceReadiness()} />;
}
