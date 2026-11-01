import "server-only";

import { del, get, put } from "@vercel/blob";

import { tenantObjectKey } from "@/lib/hosted/tenant-scope.mjs";

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
export const ALLOWED_RESUME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "application/x-tex",
]);

const RESUME_TYPE_BY_EXTENSION = new Map([
  ["pdf", "application/pdf"],
  ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ["txt", "text/plain"],
  ["md", "text/markdown"],
  ["markdown", "text/markdown"],
  ["tex", "application/x-tex"],
]);

export function resolveResumeContentType(file: Pick<File, "name" | "type">) {
  const reportedType = file.type.trim().toLowerCase();
  if (ALLOWED_RESUME_TYPES.has(reportedType)) return reportedType;

  const extension = file.name.split(".").pop()?.trim().toLowerCase() || "";
  return RESUME_TYPE_BY_EXTENSION.get(extension) || null;
}

export function isPrivateObjectStoreConfigured(env = process.env) {
  const token = String(env.BLOB_READ_WRITE_TOKEN || "").trim();
  const oidc = String(env.VERCEL_OIDC_TOKEN || "").trim();
  const storeId = String(env.BLOB_STORE_ID || "").trim();
  return Boolean(token || (oidc && storeId));
}

export async function uploadPrivateResume(ownerId: string, file: File) {
  if (!isPrivateObjectStoreConfigured()) throw new Error("Private object storage is not configured.");
  const contentType = resolveResumeContentType(file);
  if (!contentType) throw new Error("Unsupported resume file type.");
  if (file.size <= 0 || file.size > MAX_RESUME_BYTES) {
    throw new Error("Resume files must be between 1 byte and 5 MB.");
  }

  const pathname = tenantObjectKey(ownerId, "resumes", file.name);
  const blob = await put(pathname, file, {
    access: "private",
    addRandomSuffix: true,
    contentType,
    maximumSizeInBytes: MAX_RESUME_BYTES,
    cacheControlMaxAge: 60,
  });
  return { ...blob, contentType };
}

export async function readPrivateObject(pathname: string) {
  if (!isPrivateObjectStoreConfigured()) throw new Error("Private object storage is not configured.");
  return get(pathname, { access: "private", useCache: false });
}

export async function deletePrivateObject(pathname: string) {
  if (!isPrivateObjectStoreConfigured()) throw new Error("Private object storage is not configured.");
  await del(pathname);
}
