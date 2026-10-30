/**
 * Keep the public hosted preview separate from the local dashboard until the
 * hosted app has Clerk authentication and tenant-scoped persistence.
 */
export function isHostedDeployment(value) {
  return String(value || "").trim().toLowerCase() === "hosted";
}

export function isMarketingPath(pathname) {
  return ["/welcome", "/about", "/legal"].some(
    (basePath) => pathname === basePath || pathname.startsWith(`${basePath}/`),
  );
}

export function isHostedAppPath(pathname) {
  return ["/onboarding", "/app"].some(
    (basePath) => pathname === basePath || pathname.startsWith(`${basePath}/`),
  );
}

export function isHostedAuthPath(pathname) {
  return ["/sign-in", "/sign-up", "/__clerk"].some(
    (basePath) => pathname === basePath || pathname.startsWith(`${basePath}/`),
  );
}

export function isHostedApiPath(pathname) {
  return pathname === "/api/hosted" || pathname.startsWith("/api/hosted/");
}

export function isHostedProtectedPath(pathname) {
  return isHostedAppPath(pathname) || isHostedApiPath(pathname);
}

export function usesStandaloneShell(pathname) {
  return isMarketingPath(pathname) || isHostedAppPath(pathname) || isHostedAuthPath(pathname);
}

export function hostedRouteDecision(pathname) {
  if (pathname === "/") {
    return { action: "redirect", pathname: "/welcome" };
  }

  if (
    isMarketingPath(pathname)
    || isHostedAppPath(pathname)
    || isHostedAuthPath(pathname)
    || isHostedApiPath(pathname)
    || pathname === "/icon.svg"
  ) {
    return { action: "allow" };
  }

  return { action: "block" };
}
