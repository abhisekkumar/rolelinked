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

// Read-only presentation assets used by both the local dashboard and hosted
// workspace. Keep this list narrow: unlike /api/hosted/*, these routes expose
// no tenant data and perform no user action.
export function isHostedPublicAssetPath(pathname) {
  return pathname === "/api/logo";
}

// QStash is the authenticated caller for this single machine-to-machine route.
// Keeping it behind Clerk makes every delivery fail before the handler can
// verify Upstash's signature. The route itself fails closed when the signature
// or signing keys are missing/invalid; all browser-facing hosted APIs remain
// Clerk-protected.
export function isHostedSignedWorkerPath(pathname) {
  return pathname === "/api/hosted/discovery/worker";
}

export function isHostedProtectedPath(pathname) {
  return isHostedAppPath(pathname)
    || (isHostedApiPath(pathname) && !isHostedSignedWorkerPath(pathname));
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
    || isHostedPublicAssetPath(pathname)
    || pathname === "/icon.svg"
  ) {
    return { action: "allow" };
  }

  return { action: "block" };
}
