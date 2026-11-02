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
  const vercelRuntime = Boolean(
    String(env.VERCEL || "").trim()
    || String(env.VERCEL_ENV || "").trim(),
  );
  return Boolean(token || (storeId && (oidc || vercelRuntime)));
}

export function isHostedSchedulerConfigured(env = process.env) {
  return Boolean(
    String(env.QSTASH_TOKEN || "").trim()
    && String(env.QSTASH_CURRENT_SIGNING_KEY || "").trim()
    && String(env.QSTASH_NEXT_SIGNING_KEY || "").trim(),
  );
}

export function getHostedServiceReadiness(env = process.env) {
  const auth = isHostedAuthConfigured(env);
  const database = isHostedDatabaseConfigured(env);
  const objectStorage = isHostedObjectStorageConfigured(env);
  const scheduler = isHostedSchedulerConfigured(env);
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
