import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
const source = readFileSync(join(ROOT, "components/explore/discovering-state.tsx"), "utf8");

test("queued public boards are visibly described as waiting, not disabled", () => {
  assert.match(source, /state === "queued" \? "waiting"/);
  assert.match(source, />next<\/span>/);
  assert.match(source, /Additional boards run next/);
  assert.doesNotMatch(source, /data-state="queued"\]\{opacity:\.4/);
});
