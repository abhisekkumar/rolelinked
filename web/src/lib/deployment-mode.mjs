/**
 * Keep the public hosted preview separate from the local dashboard until the
 * hosted app has Clerk authentication and tenant-scoped persistence.
 */
export function isHostedDeployment(value, env = process.env) {
  const configuredMode = String(value || "").trim().toLowerCase();
  if (configuredMode === "hosted") return true;

  // A Vercel deployment must never fall back to the local dashboard mode just
  // because ROLELINKED_DEPLOYMENT_MODE was omitted from one environment scope.
  // Local mode protects filesystem-backed routes with a loopback Host guard;
  // that guard cannot work behind Vercel's public proxy and produces a 403 for
  // every request. Vercel exposes these system variables at build and runtime,
  // so use them only as a platform signal—the hosted route allowlist and Clerk
  // authentication remain the actual access controls.
  const vercel = String(env?.VERCEL || "").trim();
  const vercelEnvironment = String(env?.VERCEL_ENV || env?.VERCEL_TARGET_ENV || "")
    .trim()
    .toLowerCase();

  return vercel === "1" || ["production", "preview", "development"].includes(vercelEnvironment);
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
