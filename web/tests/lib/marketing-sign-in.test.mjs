import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(here, "../../src/components/marketing/marketing-header.tsx"), "utf8");

test("the public header exposes distinct sign-in and account-creation paths", () => {
  assert.match(source, /href="\/sign-in\?redirect_url=%2Fapp%2Ftoday"/);
  assert.match(source, />Sign in<\/Link>/);
  assert.match(source, /href="\/sign-up\?redirect_url=%2Fonboarding"/);
  assert.match(source, /Start free/);
});
