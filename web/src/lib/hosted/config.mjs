/**
 * Hosted-service configuration is intentionally reduced to booleans before it
 * reaches a page or API response. Secret values must never be serialized.
 */
export function isHostedAuthConfigured(env = process.env) {
  return Boolean(
    String(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "").trim()
    && String(env.CLERK_SECRET_KEY || "").trim(),
  );
}

export function getHostedServiceReadiness(env = process.env) {
  const auth = isHostedAuthConfigured(env);
  const database = Boolean(String(env.DATABASE_URL || "").trim());
  const objectStorage = Boolean(
    String(env.OBJECT_STORAGE_ENDPOINT || "").trim()
    && String(env.OBJECT_STORAGE_BUCKET || "").trim()
    && String(env.OBJECT_STORAGE_ACCESS_KEY_ID || "").trim()
    && String(env.OBJECT_STORAGE_SECRET_ACCESS_KEY || "").trim(),
  );
  const scheduler = Boolean(String(env.SCHEDULER_SIGNING_SECRET || "").trim());
  const modelGateway = Boolean(String(env.LLM_GATEWAY_API_KEY || "").trim());

  return {
    auth,
    database,
    objectStorage,
    scheduler,
    modelGateway,
    deployment: String(env.ROLELINKED_DEPLOYMENT_MODE || "local").trim().toLowerCase(),
  };
}
