/**
 * Keep the public hosted preview separate from the local dashboard until the
 * hosted app has Clerk authentication and tenant-scoped persistence.
 */
export function isHostedDeployment(value) {
  return String(value || "").trim().toLowerCase() === "hosted";
}

export function hostedRouteDecision(pathname) {
  if (pathname === "/") {
    return { action: "redirect", pathname: "/welcome" };
  }

  if (
    pathname === "/welcome" ||
    pathname.startsWith("/welcome/") ||
    pathname === "/icon.svg"
  ) {
    return { action: "allow" };
  }

  return { action: "block" };
}
