import { redirect } from "next/navigation";

import { HostedAppShell } from "@/components/hosted/hosted-app-shell";
import { isHostedDatabaseConfigured } from "@/lib/hosted/config.mjs";
import { getHostedProfile } from "@/lib/hosted/db/repository";
import { getHostedIdentity } from "@/lib/hosted/identity";

export default async function HostedWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const identity = await getHostedIdentity();
  if (!identity) redirect("/sign-in");

  let onboardingComplete = identity.mode === "preview";
  if (identity.mode === "clerk" && isHostedDatabaseConfigured()) {
    try {
      const profile = await getHostedProfile(identity.userId);
      onboardingComplete = Boolean(profile.user?.onboardingComplete);
    } catch {
      onboardingComplete = false;
    }
  }

  return <HostedAppShell identity={identity} onboardingComplete={onboardingComplete}>{children}</HostedAppShell>;
}
