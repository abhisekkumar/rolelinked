import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (relativePath) => readFileSync(path.join(here, "../..", relativePath), "utf8");

test("onboarding saves a draft before leaving for the private resume library", () => {
  const onboarding = read("src/components/hosted/onboarding-experience.tsx");
  const repository = read("src/lib/hosted/db/repository.ts");
  assert.match(onboarding, /profile\?complete=\$\{complete \? "true" : "false"\}/);
  assert.match(onboarding, /app\/resumes\?returnTo=onboarding/);
  assert.match(repository, /markOnboardingComplete !== false/);
});

test("the workspace reads Neon completion state instead of always showing Finish setup", () => {
  const layout = read("src/app/app/layout.tsx");
  const shell = read("src/components/hosted/hosted-app-shell.tsx");
  assert.match(layout, /profile\.user\?\.onboardingComplete/);
  assert.match(shell, /onboardingComplete \? "Edit preferences" : "Continue setup"/);
  assert.doesNotMatch(shell, />Finish setup</);
});

test("the resume library provides a clear route back to onboarding", () => {
  const library = read("src/components/hosted/resume-library.tsx");
  assert.match(library, /Return to setup/);
  assert.match(library, /\/onboarding\?step=resumes/);
});
