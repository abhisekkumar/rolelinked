# Reviewing Career Ops upstream changes

RoleLinked is a derivative of Career Ops and intentionally keeps an `upstream`
Git remote. Upstream changes must be reviewed before they enter RoleLinked;
the Career Ops self-updater is not the RoleLinked update mechanism.

## One-time remotes

After you create your public repository:

```bash
git remote add origin https://github.com/<your-account>/rolelinked.git
git remote add upstream https://github.com/career-ops-hq/career-ops.git
```

If `upstream` already exists, do not add it again.

## Safe review workflow

```bash
git fetch upstream --tags
git switch -c codex/review-career-ops-update
git merge --no-commit --no-ff upstream/main
```

Review conflicts and the complete diff. Preserve RoleLinked branding, privacy
boundaries, approval gates, and public-only discovery sources. Run the test and
privacy checks before committing. Abort the review with `git merge --abort` if
the result is not ready.

Never run `npm run career-ops:update:unsafe` in the public RoleLinked checkout
unless you deliberately intend to replace RoleLinked system files and have a
recoverable branch or backup.
