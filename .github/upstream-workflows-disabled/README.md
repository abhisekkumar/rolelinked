# Disabled upstream workflows

These workflows came from the Career Ops upstream repository and are preserved
for attribution and future reference. GitHub does not execute workflow files
from this directory.

They are intentionally disabled because they manage upstream-specific releases,
sponsorship, Discord notifications, manifesto signatures, issue triage, labels,
contributor assignment, stale policies, and other maintainer operations. Enabling
them unchanged in RoleLinked would create misleading messages and grant write
permissions to automation that has not been reviewed for this project.

Reintroduce a workflow only after:

1. replacing Career Ops names, links, secrets, labels, and release conventions;
2. reducing `permissions` to the minimum required;
3. reviewing `pull_request_target`, issue-comment, and scheduled triggers;
4. adding tests or a dry-run path;
5. documenting the RoleLinked maintainer responsible for it.

The active first-release workflows are limited to tests, web CI, CodeQL,
dependency review, and the no-user-data guard.
