import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

let database: ReturnType<typeof createDatabase> | undefined;

function createDatabase() {
  const connectionString = String(process.env.DATABASE_URL || "").trim();
  if (!connectionString) {
    throw new Error("Hosted database is not configured.");
  }
  const client = neon(connectionString);
  return drizzle(client, { schema });
}

export function getHostedDatabase() {
  database ??= createDatabase();
  return database;
}
