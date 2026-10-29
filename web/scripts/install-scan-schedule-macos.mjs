#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isMainModule } from "../../lib/is-main-module.mjs";
import { getCareerOpsRoot } from "../../path-resolver.mjs";

export const LAUNCH_AGENT_LABEL = "com.rolelinked.recurring-scan";

const CODE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function xml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function launchAgentPlist({ nodePath, runnerPath, codeRoot, dataRoot, stdoutPath, stderrPath }) {
  const string = (key, value) => `    <key>${key}</key>\n    <string>${xml(value)}</string>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
${string("Label", LAUNCH_AGENT_LABEL)}
    <key>ProgramArguments</key>
    <array>
      <string>${xml(nodePath)}</string>
      <string>${xml(runnerPath)}</string>
    </array>
${string("WorkingDirectory", codeRoot)}
    <key>EnvironmentVariables</key>
    <dict>
${string("CAREER_OPS_CODE_ROOT", codeRoot)}
${string("CAREER_OPS_ROOT", dataRoot)}
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>StartInterval</key>
    <integer>900</integer>
    <key>ProcessType</key>
    <string>Background</string>
    <key>LowPriorityIO</key>
    <true/>
${string("StandardOutPath", stdoutPath)}
${string("StandardErrorPath", stderrPath)}
</dict>
</plist>
`;
}

export function installLaunchAgent() {
  if (process.platform !== "darwin") throw new Error("This installer is for macOS only.");
  if (typeof process.getuid !== "function") throw new Error("Could not determine the current macOS user.");

  const dataRoot = getCareerOpsRoot();
  const runnerPath = path.join(CODE_ROOT, "web", "scripts", "scheduled-jobs-runner.mjs");
  if (!fs.existsSync(runnerPath)) throw new Error(`Scheduled job runner not found: ${runnerPath}`);

  const launchAgentsDir = path.join(os.homedir(), "Library", "LaunchAgents");
  const plistPath = path.join(launchAgentsDir, `${LAUNCH_AGENT_LABEL}.plist`);
  const logDir = path.join(dataRoot, "data", "logs");
  const stdoutPath = path.join(logDir, "scheduled-jobs.log");
  const stderrPath = path.join(logDir, "scheduled-jobs-error.log");
  const service = `gui/${process.getuid()}/${LAUNCH_AGENT_LABEL}`;
  const domain = `gui/${process.getuid()}`;

  fs.mkdirSync(launchAgentsDir, { recursive: true });
  fs.mkdirSync(logDir, { recursive: true });

  try {
    execFileSync("/bin/launchctl", ["bootout", service], { stdio: "ignore" });
  } catch {
    // A first install has no service to unload.
  }

  const temporaryPath = `${plistPath}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryPath, launchAgentPlist({
    nodePath: process.execPath,
    runnerPath,
    codeRoot: CODE_ROOT,
    dataRoot,
    stdoutPath,
    stderrPath,
  }), { mode: 0o600 });
  fs.renameSync(temporaryPath, plistPath);

  execFileSync("/bin/launchctl", ["bootstrap", domain, plistPath], { stdio: "inherit" });
  execFileSync("/bin/launchctl", ["enable", service], { stdio: "inherit" });

  return { plistPath, service, dataRoot, stdoutPath, stderrPath };
}

if (isMainModule(import.meta.url)) {
  try {
    const installed = installLaunchAgent();
    process.stdout.write([
      "Installed the RoleLinked macOS scheduler.",
      `Service: ${installed.service}`,
      "Checks for due scans every 15 minutes and after login.",
      `Data root: ${installed.dataRoot}`,
      `Log: ${installed.stdoutPath}`,
      `Errors: ${installed.stderrPath}`,
    ].join("\n") + "\n");
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
