const TENANT_ID_PATTERN = /^[A-Za-z0-9_-]{3,128}$/;
const OBJECT_CATEGORY_PATTERN = /^[a-z][a-z0-9-]{1,31}$/;

export function requireTenantId(value) {
  const tenantId = String(value || "").trim();
  if (!TENANT_ID_PATTERN.test(tenantId)) {
    throw new Error("A valid authenticated tenant id is required.");
  }
  return tenantId;
}

export function safeObjectFilename(value) {
  const filename = String(value || "file")
    .normalize("NFKC")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return filename || "file";
}

export function tenantObjectKey(ownerId, category, filename) {
  const tenantId = requireTenantId(ownerId);
  const normalizedCategory = String(category || "").trim().toLowerCase();
  if (!OBJECT_CATEGORY_PATTERN.test(normalizedCategory)) {
    throw new Error("A valid private object category is required.");
  }
  return `users/${tenantId}/${normalizedCategory}/${safeObjectFilename(filename)}`;
}
