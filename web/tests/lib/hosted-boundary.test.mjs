import test from "node:test";
import assert from "node:assert/strict";
import { classifyHostedPath } from "../../src/lib/hosted-boundary.mjs";

test("hosted root redirects to the public landing page", () => {
  assert.deepEqual(classifyHostedPath("/"), { access: "public", redirectTo: "/welcome" });
});

test("landing and auth pages remain public", () => {
  for (const path of ["/welcome", "/welcome/privacy", "/sign-in", "/sign-in/factor-one", "/sign-up"]) {
    assert.deepEqual(classifyHostedPath(path), { access: "public" });
  }
});

test("hosted workspace and status API require authentication", () => {
  assert.deepEqual(classifyHostedPath("/app"), { access: "authenticated" });
  assert.deepEqual(classifyHostedPath("/api/hosted/status"), { access: "authenticated" });
});

test("legacy APIs fail closed after authentication", () => {
  assert.deepEqual(classifyHostedPath("/api/run"), { access: "authenticated", unavailable: true });
  assert.deepEqual(classifyHostedPath("/api/cv"), { access: "authenticated", unavailable: true });
});

test("legacy local dashboard pages redirect to the safe hosted shell", () => {
  assert.deepEqual(classifyHostedPath("/pipeline"), { access: "authenticated", redirectTo: "/app" });
  assert.deepEqual(classifyHostedPath("/documents"), { access: "authenticated", redirectTo: "/app" });
});
