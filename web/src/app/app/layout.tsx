import { HostedAppShell } from "@/components/hosted/hosted-app-shell";

export default function HostedWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <HostedAppShell>{children}</HostedAppShell>;
}
