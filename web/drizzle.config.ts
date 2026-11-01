import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/hosted/db/schema.ts",
  out: "./drizzle",
  strict: true,
  verbose: true,
  dbCredentials: {
    // Prefer Neon's direct connection for migrations. Runtime requests use the
    // pooled DATABASE_URL through the serverless driver.
    url: process.env.DATABASE_URL_UNPOOLED
      ?? process.env.DATABASE_URL
      ?? "postgresql://rolelinked:rolelinked@localhost:5432/rolelinked",
  },
});
