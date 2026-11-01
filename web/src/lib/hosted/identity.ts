import "server-only";

import { auth } from "@clerk/nextjs/server";

import { isHostedDeployment } from "@/lib/deployment-mode.mjs";
import { isHostedAuthConfigured } from "@/lib/hosted/config.mjs";
import { requireTenantId } from "@/lib/hosted/tenant-scope.mjs";

export type HostedIdentity = {
  mode: "preview" | "clerk";
  userId: string;
  label: string;
  detail: string;
};

/**
 * Preview identity is deliberately non-persistent. Once Clerk is configured,
 * every hosted page and API route receives a real Clerk user id instead.
 */
export async function getHostedIdentity(): Promise<HostedIdentity | null> {
  if (!isHostedAuthConfigured()) {
    // A public hosted deployment must fail closed. Preview identity only exists
    // for an explicit local development run and can never own persisted data.
    if (isHostedDeployment(process.env.ROLELINKED_DEPLOYMENT_MODE)) return null;
    return {
      mode: "preview",
      userId: "preview-only",
      label: "Demo workspace",
      detail: "Sample data only",
    };
  }

  const session = await auth();
  if (!session.userId) return null;
  const userId = requireTenantId(session.userId);

  return {
    mode: "clerk",
    userId,
    label: "Your workspace",
    detail: "Private account",
  };
}

export async function requireHostedUserId() {
  const identity = await getHostedIdentity();
  if (!identity || identity.mode !== "clerk") {
    throw new Error("Authentication required.");
  }
  return identity.userId;
}
