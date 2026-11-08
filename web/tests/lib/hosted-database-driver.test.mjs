import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(here, "../../src/lib/hosted/db/client.ts"), "utf8");

test("hosted database uses the transaction-capable Neon driver required by tenant RLS", () => {
  assert.match(source, /drizzle-orm\/neon-serverless/);
  assert.match(source, /new Pool\(\{ connectionString \}\)/);
  assert.doesNotMatch(source, /drizzle-orm\/neon-http/);
});
