import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { IntegrationsView } from "@/components/hosted/integrations-view";
import { isHostedAdmin } from "@/lib/hosted/admin";
import { getHostedServiceReadiness } from "@/lib/hosted/config.mjs";
import { getHostedIdentity } from "@/lib/hosted/identity";

export const metadata: Metadata = {
  title: "Admin infrastructure — RoleLinked",
  description: "Admin-only readiness for the services behind hosted RoleLinked.",
};
export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const identity = await getHostedIdentity();
  if (!identity || !(await isHostedAdmin(identity))) redirect("/app/today");
  return <IntegrationsView readiness={getHostedServiceReadiness()} />;
}
