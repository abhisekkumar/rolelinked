import assert from "node:assert/strict";
import test from "node:test";
import { LAUNCH_AGENT_LABEL, launchAgentPlist } from "../../scripts/install-scan-schedule-macos.mjs";

test("RoleLinked macOS LaunchAgent runs every 15 minutes with private roots", () => {
  const plist = launchAgentPlist({
    nodePath: "/opt/homebrew/bin/node",
    runnerPath: "/tmp/Career & Ops/web/scripts/scheduled-jobs-runner.mjs",
    codeRoot: "/tmp/Career & Ops",
    dataRoot: "/tmp/private <data>",
    stdoutPath: "/tmp/private/data/logs/out.log",
    stderrPath: "/tmp/private/data/logs/error.log",
  });

  assert.match(plist, new RegExp(LAUNCH_AGENT_LABEL));
  assert.match(plist, /<key>StartInterval<\/key>\s*<integer>900<\/integer>/);
  assert.match(plist, /<key>RunAtLoad<\/key>\s*<true\/>/);
  assert.match(plist, /CAREER_OPS_ROOT/);
  assert.match(plist, /Career &amp; Ops/);
  assert.match(plist, /private &lt;data&gt;/);
  assert.doesNotMatch(plist, /<key>KeepAlive<\/key>/);
});
