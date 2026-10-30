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

export function usesStandaloneShell(pathname) {
  return isMarketingPath(pathname) || isHostedAppPath(pathname);
}

export function hostedRouteDecision(pathname) {
  if (pathname === "/") {
    return { action: "redirect", pathname: "/welcome" };
  }

  if (isMarketingPath(pathname) || isHostedAppPath(pathname) || pathname === "/icon.svg") {
    return { action: "allow" };
  }

  return { action: "block" };
}
