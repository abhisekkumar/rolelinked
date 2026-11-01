/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hosted local previews bind to `localhost` so Clerk and Next agree on the
  // canonical origin. Existing local links may still use the equivalent IPv4
  // loopback spelling; permit that spelling for dev assets only. This does not
  // admit LAN hosts and has no effect in production.
  allowedDevOrigins: ["127.0.0.1"],
  // Two lockfiles exist on purpose (repo root + web/), so Next would infer the
  // repo root as the workspace root. On Windows that misinference can send
  // Turbopack's postcss workers into an unbounded respawn loop that exhausts
  // all RAM (vercel/next.js#92978) — pin the root to this app.
  turbopack: { root: import.meta.dirname },
  // Allow a throwaway build dir (e.g. BUILD_DIST=.next-prod) so a production
  // `next build` can run without clobbering a live `next dev` .next.
  ...(process.env.BUILD_DIST ? { distDir: process.env.BUILD_DIST } : {}),
};

export default nextConfig;
