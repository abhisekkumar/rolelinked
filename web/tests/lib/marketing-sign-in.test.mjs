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
  assert.match(source, /"\/sign-up\?redirect_url=%2Fonboarding"/);
  assert.match(source, /Start free/);
});

test("the public header replaces auth prompts with the current account and workspace when signed in", () => {
  assert.match(source, /signedIn \? \(/);
  assert.match(source, /<UserButton/);
  assert.match(source, /href=\{signedIn \? "\/app\/today"/);
  assert.match(source, /signedIn \? "Open workspace" : "Start free"/);
});
