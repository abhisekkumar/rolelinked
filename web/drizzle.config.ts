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
    // Generation only needs a syntactically valid URL. Migrations still fail
    // closed unless the deployment supplies the real Neon DATABASE_URL.
    url: process.env.DATABASE_URL ?? "postgresql://rolelinked:rolelinked@localhost:5432/rolelinked",
  },
});
