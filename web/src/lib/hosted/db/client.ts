import "server-only";

import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import * as schema from "./schema";

let database: ReturnType<typeof createDatabase> | undefined;

function createDatabase() {
  const connectionString = String(process.env.DATABASE_URL || "").trim();
  if (!connectionString) {
    throw new Error("Hosted database is not configured.");
  }
  // The HTTP driver deliberately does not implement transactions. RoleLinked
  // needs a transaction for every tenant-scoped operation so the RLS owner id
  // remains transaction-local and cannot leak into a later request.
  const client = new Pool({ connectionString });
  return drizzle(client, { schema });
}

export function getHostedDatabase() {
  database ??= createDatabase();
  return database;
}
