import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import {
  checkRequest,
  parseAllowedHosts,
  parseAllowedOrigins,
} from "@/lib/origin-guard.mjs";
import {
  hostedRouteDecision,
  isHostedProtectedPath,
  isHostedDeployment,
} from "@/lib/deployment-mode.mjs";
import { isHostedAuthConfigured } from "@/lib/hosted/config.mjs";

function hostedRouteGuard(req: NextRequest) {
  const route = hostedRouteDecision(req.nextUrl.pathname);
  if (route.action === "redirect" && route.pathname) {
    return NextResponse.redirect(new URL(route.pathname, req.url));
  }
  if (route.action === "allow") return NextResponse.next();

  return NextResponse.json(
    { error: "This local-only RoleLinked route is unavailable in hosted mode." },
    { status: 404 },
  );
}

const hostedClerkProxy = clerkMiddleware(async (auth, req) => {
  const route = hostedRouteDecision(req.nextUrl.pathname);
  if (route.action === "redirect" && route.pathname) {
    return NextResponse.redirect(new URL(route.pathname, req.url));
  }
  if (route.action !== "allow") {
    return NextResponse.json(
      { error: "This local-only RoleLinked route is unavailable in hosted mode." },
      { status: 404 },
    );
  }

  if (isHostedProtectedPath(req.nextUrl.pathname)) {
    const session = await auth();
    if (!session.userId) {
      if (req.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Authentication required." }, { status: 401 });
      }

      const signIn = new URL("/sign-in", req.url);
      signIn.searchParams.set("redirect_url", `${req.nextUrl.pathname}${req.nextUrl.search}`);
      return NextResponse.redirect(signIn);
    }
  }

  return NextResponse.next();
});

// Single choke point over everything the dashboard serves. Every request is
// gated on the same-origin + loopback guard before it can reach a route handler
// (which may spawn a child process or write the user's files) or a page (which
// renders the user's CV, pipeline and reports). See origin-guard.mjs for the
// two-layer rationale (F1 drive-by CSRF, F2 LAN reachability).
//
// Opt in to extra hosts (e.g. a trusted LAN box) with a comma/space separated
// CAREER_OPS_WEB_ALLOWED_HOSTS; unset means loopback only.
//
// Opt in to extra *origins* the same way with CAREER_OPS_ALLOWED_ORIGINS;
// unset means none, which is the default and leaves the guard as strict as it
// was. It is what a local companion client needs: a browser extension calls
// from a chrome-extension:// origin, which Fetch Metadata always reports as
// "cross-site", so every one of its requests is refused otherwise.
export function proxy(req: NextRequest, event: NextFetchEvent) {
  if (isHostedDeployment(process.env.ROLELINKED_DEPLOYMENT_MODE)) {
    if (isHostedAuthConfigured()) return hostedClerkProxy(req, event);
    return hostedRouteGuard(req);
  }

  const decision = checkRequest({
    secFetchSite: req.headers.get("sec-fetch-site"),
    origin: req.headers.get("origin"),
    host: req.headers.get("host"),
    allowedHosts: parseAllowedHosts(process.env.CAREER_OPS_WEB_ALLOWED_HOSTS),
    allowedOrigins: parseAllowedOrigins(process.env.CAREER_OPS_ALLOWED_ORIGINS),
  });
  if (!decision.ok) {
    return NextResponse.json({ error: decision.reason }, { status: decision.status });
  }
  return NextResponse.next();
}

// Everything except build assets. Scoping this to /api left every page route
// ungated, which loopback does not cover: a page that re-resolves its own domain
// to 127.0.0.1 (DNS rebinding) fetches /pipeline same-origin from the user's own
// browser, and force-dynamic pages read the tracker off disk on each request.
// The Host header carries the attacker's domain there, so the guard refuses it —
// but only if it runs. Build assets stay out: they are the same for every user,
// carry nothing of theirs, and a caller who cannot read a page has no use for
// the chunk that renders it.
export const config = { matcher: "/((?!_next/static|_next/image|favicon.ico).*)" };
