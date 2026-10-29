#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { LAUNCH_AGENT_LABEL } from "./install-scan-schedule-macos.mjs";

if (process.platform !== "darwin") {
  process.stderr.write("This uninstaller is for macOS only.\n");
  process.exitCode = 1;
} else if (typeof process.getuid !== "function") {
  process.stderr.write("Could not determine the current macOS user.\n");
  process.exitCode = 1;
} else {
  const plistPath = path.join(os.homedir(), "Library", "LaunchAgents", `${LAUNCH_AGENT_LABEL}.plist`);
  const service = `gui/${process.getuid()}/${LAUNCH_AGENT_LABEL}`;
  try {
    execFileSync("/bin/launchctl", ["bootout", service], { stdio: "ignore" });
  } catch {
    // Already unloaded is a successful uninstall state.
  }
  if (fs.existsSync(plistPath)) fs.unlinkSync(plistPath);
  process.stdout.write(`Removed ${service}. Private scan data and logs were preserved.\n`);
}
