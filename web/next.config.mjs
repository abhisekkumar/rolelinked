import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hosted local previews bind to `localhost` so Clerk and Next agree on the
  // canonical origin. Existing local links may still use the equivalent IPv4
  // loopback spelling; permit that spelling for dev assets only. This does not
  // admit LAN hosts and has no effect in production.
  allowedDevOrigins: ["127.0.0.1"],
  // Hosted discovery statically imports the repository's hardened public-ATS
  // providers. Trace from the repository root so Vercel includes those shared
  // modules in the server function instead of maintaining a hosted-only copy.
  outputFileTracingRoot: path.join(import.meta.dirname, ".."),
  outputFileTracingIncludes: {
    "/api/hosted/discovery/run": [
      "../providers/**/*.mjs",
      "../url-key.mjs",
      "../user-agent.mjs",
    ],
  },
  // Allow a throwaway build dir (e.g. BUILD_DIST=.next-prod) so a production
  // `next build` can run without clobbering a live `next dev` .next.
  ...(process.env.BUILD_DIST ? { distDir: process.env.BUILD_DIST } : {}),
};

export default nextConfig;
