import "server-only";

import { auth } from "@clerk/nextjs/server";

import { isHostedAuthConfigured } from "@/lib/hosted/config.mjs";

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
    return {
      mode: "preview",
      userId: "preview-only",
      label: "Demo workspace",
      detail: "Sample data only",
    };
  }

  const session = await auth();
  if (!session.userId) return null;

  return {
    mode: "clerk",
    userId: session.userId,
    label: "Your workspace",
    detail: "Private account",
  };
}
