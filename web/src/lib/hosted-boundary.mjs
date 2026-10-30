const PUBLIC_PREFIXES = ["/welcome", "/sign-in", "/sign-up"];
const HOSTED_PAGE_PREFIXES = ["/app"];
const HOSTED_API_PREFIXES = ["/api/hosted/"];

function matchesPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function classifyHostedPath(pathname) {
  const path = typeof pathname === "string" && pathname.startsWith("/") ? pathname : "/";

  if (path === "/") return { access: "public", redirectTo: "/welcome" };
  if (PUBLIC_PREFIXES.some((prefix) => matchesPrefix(path, prefix))) {
    return { access: "public" };
  }
  if (HOSTED_API_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return { access: "authenticated" };
  }
  if (path === "/api" || path.startsWith("/api/")) {
    return { access: "authenticated", unavailable: true };
  }
  if (HOSTED_PAGE_PREFIXES.some((prefix) => matchesPrefix(path, prefix))) {
    return { access: "authenticated" };
  }

  return { access: "authenticated", redirectTo: "/app" };
}

export const HOSTED_UNAVAILABLE_MESSAGE =
  "This local-only capability is disabled in hosted mode until tenant-scoped storage and workers are connected.";
