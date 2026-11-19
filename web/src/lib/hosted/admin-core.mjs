export function parseHostedAdminUserIds(value = "") {
  return new Set(String(value).split(/[\s,]+/).map((item) => item.trim()).filter(Boolean));
}

export function hasHostedAdminRole(metadata) {
  return Boolean(metadata && typeof metadata === "object" && metadata.role === "admin");
}
