# Publish RoleLinked safely

The prepared RoleLinked checkout keeps Career Ops as `upstream` and has no
`origin`. Nothing is published until you create a repository and push it.

## 1. Create the GitHub repository

Create an empty public repository named `rolelinked`. Do not initialize it with
a README, license, or `.gitignore`; those files already exist locally.

## 2. Review the local changes and privacy boundary

From the RoleLinked checkout:

```bash
git status --short
git diff --check
git diff --stat
git check-ignore -v cv.md config/profile.yml portals.yml data/applications.md data/Connections.csv .env
git grep -n -I -E '[/]Users/|/home/|password|api[_-]?key|secret|token' -- . ':!*.example*' ':!test-fixtures/**'
```

Review every reported path. Do not publish real resumes, profiles, trackers,
reports, interview notes, LinkedIn exports, screenshots, or credentials.

## 3. Verify before the first commit

```bash
npm install --ignore-scripts
npm run lint
npm run linkedin:import:self-test

cd web
npm install --ignore-scripts
npm run typecheck
npm test
npm run build
cd ..
```

## 4. Create the first RoleLinked commit

```bash
git add -A
git diff --cached --stat
git diff --cached --check
git commit -m "feat: establish RoleLinked local-first career platform"
```

## 5. Connect and push your repository

Replace the URL below with the repository you created:

```bash
git remote add origin https://github.com/<your-account>/rolelinked.git
git push -u origin main
```

The existing `upstream` remote should continue to point to
`https://github.com/career-ops-hq/career-ops.git`. Follow
`docs/UPSTREAM_SYNC.md` when reviewing future upstream work.

## 6. Enable in-app bug reports after publication

Set this public build variable to your GitHub `owner/repository` value:

```bash
NEXT_PUBLIC_ROLELINKED_REPO=<your-account>/rolelinked
```

Without this setting, the beta badge remains available but the bug-report
button stays hidden. This prevents RoleLinked issues from being sent to the
Career Ops upstream repository.
