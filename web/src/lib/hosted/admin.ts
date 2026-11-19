import "server-only";

import { currentUser } from "@clerk/nextjs/server";

import type { HostedIdentity } from "@/lib/hosted/identity";
import { hasHostedAdminRole, parseHostedAdminUserIds } from "./admin-core.mjs";

/**
 * Infrastructure configuration is never a workspace-user concern. Local
 * preview keeps the page available to developers; hosted access fails closed
 * unless the Clerk user is explicitly allowlisted or has publicMetadata.role
 * set to "admin".
 */
export async function isHostedAdmin(identity: HostedIdentity) {
  if (identity.mode === "preview") return true;

  const configuredAllowlist = process.env.ROLELINKED_ADMIN_USER_IDS?.trim();
  const allowlist = parseHostedAdminUserIds(configuredAllowlist);
  if (configuredAllowlist) return allowlist.has(identity.userId);

  try {
    const user = await currentUser();
    return user?.id === identity.userId && hasHostedAdminRole(user.publicMetadata);
  } catch {
    return false;
  }
}
