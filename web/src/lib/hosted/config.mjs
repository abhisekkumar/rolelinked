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

export function isHostedDatabaseConfigured(env = process.env) {
  return Boolean(String(env.DATABASE_URL || "").trim());
}

export function isHostedObjectStorageConfigured(env = process.env) {
  const token = String(env.BLOB_READ_WRITE_TOKEN || "").trim();
  const oidc = String(env.VERCEL_OIDC_TOKEN || "").trim();
  const storeId = String(env.BLOB_STORE_ID || "").trim();
  return Boolean(token || (oidc && storeId));
}

export function getHostedServiceReadiness(env = process.env) {
  const auth = isHostedAuthConfigured(env);
  const database = isHostedDatabaseConfigured(env);
  const objectStorage = isHostedObjectStorageConfigured(env);
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
