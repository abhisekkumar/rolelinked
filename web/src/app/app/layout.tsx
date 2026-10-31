import { redirect } from "next/navigation";

import { HostedAppShell } from "@/components/hosted/hosted-app-shell";
import { getHostedIdentity } from "@/lib/hosted/identity";

export default async function HostedWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const identity = await getHostedIdentity();
  if (!identity) redirect("/sign-in");

  return <HostedAppShell identity={identity}>{children}</HostedAppShell>;
}
