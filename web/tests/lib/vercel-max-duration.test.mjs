import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(here, "../../src/app/api");

function routeFiles(directory) {
  const files = [];
  const pending = [directory];
  while (pending.length > 0) {
    const current = pending.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) pending.push(absolute);
      else if (entry.name === "route.ts") files.push(absolute);
    }
  }
  return files;
}

test("all Vercel function durations fit the Hobby plan ceiling", () => {
  const offenders = [];
  for (const file of routeFiles(apiRoot)) {
    const source = fs.readFileSync(file, "utf8");
    const match = source.match(/export\s+const\s+maxDuration\s*=\s*(\d+)/);
    if (match && Number(match[1]) > 300) {
      offenders.push(`${path.relative(apiRoot, file)}=${match[1]}`);
    }
  }
  assert.deepEqual(offenders, []);
});
