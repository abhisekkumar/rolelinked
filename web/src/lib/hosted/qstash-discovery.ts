import "server-only";

import { createHash } from "node:crypto";
import { Client } from "@upstash/qstash";

export type HostedDiscoveryMessage = { ownerId: string; runId: string };

export function buildHostedDiscoveryPublishOptions(
  message: HostedDiscoveryMessage,
  destination: string,
) {
  const ownerKey = createHash("sha256").update(message.ownerId).digest("hex").slice(0, 24);
  return {
    url: destination,
    body: message,
    deduplicationId: `rolelinked-discovery-${message.runId.replaceAll("-", "")}`,
    retries: 3,
    retryDelay: "1000 * pow(2, retried)",
    flowControl: { key: `rolelinked-${ownerKey}`, parallelism: 1, rate: 1, period: "5m" },
    label: "hosted-discovery",
  } as const;
}

export async function queueHostedDiscovery(
  message: HostedDiscoveryMessage,
  destination: string,
  env = process.env,
) {
  const token = String(env.QSTASH_TOKEN || "").trim();
  if (!token) throw new Error("Background discovery is not configured.");
  const protectionBypass = String(env.VERCEL_AUTOMATION_BYPASS_SECRET || "").trim();
  const client = new Client({ token });
  return client.publishJSON({
    ...buildHostedDiscoveryPublishOptions(message, destination),
    ...(protectionBypass
      ? { headers: { "x-vercel-protection-bypass": protectionBypass } }
      : {}),
  });
}
