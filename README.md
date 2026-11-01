# RoleLinked

**An AI career command center for discovering roles, preparing truthful applications, tracking the hiring pipeline, and practicing for interviews — on the hosted service or on your own computer.**

RoleLinked keeps the candidate in control: it can research, organize, score, and draft, but it never submits an application or sends a message without the user taking the final action.

> [!IMPORTANT]
> RoleLinked is an independent derivative of [Career Ops](https://github.com/career-ops-hq/career-ops), created under the MIT License. It is not affiliated with or endorsed by the Career Ops project. The original copyright and license are preserved in [LICENSE](LICENSE), with additional attribution in [NOTICE.md](NOTICE.md).

## Why RoleLinked

Job searching usually splits information across job boards, spreadsheets, resume editors, inboxes, and interview notes. RoleLinked connects those stages in one private workspace:

- discover roles from public employer ATS feeds and supported job boards;
- rank opportunities against explicit role, location, compensation, and work-authorization preferences;
- evaluate job descriptions against source-backed candidate facts;
- tailor resumes and application answers without inventing qualifications;
- track applied, responded, assessment, interview, offer, rejection, and follow-up states;
- prepare company-specific interview plans and reusable STAR stories;
- run locally with Claude Code, Codex, and other supported agent CLIs;
- require human approval before any external application or communication action.

## Two ways to use RoleLinked

| Edition | Best for | Data and execution |
|---|---|---|
| Hosted at `rolelinked.com` | People who want to create an account and start immediately | Clerk-authenticated, tenant-isolated cloud storage and background workers; free at launch with fair-use safeguards |
| Self-hosted/local | People who want maximum privacy, customization, and control | Files, resumes, CLIs, and model credentials stay on the user's machine |

The hosted edition will use the same product language and core workflows, but it
will not expose the local filesystem or spawn user-controlled CLI commands on a
shared server. See [docs/HOSTED_ARCHITECTURE.md](docs/HOSTED_ARCHITECTURE.md)
and [docs/HOSTED_DEPLOYMENT.md](docs/HOSTED_DEPLOYMENT.md).

## Privacy model

Personal data belongs to the user layer and is ignored by Git by default. This includes resumes, profiles, applications, reports, generated PDFs, imported LinkedIn data, interview notes, credentials, and local assistant history.

Before publishing a fork or contribution, run:

```bash
git status --short
git ls-files | rg '(^|/)(cv\.md|profile\.yml|portals\.yml|applications\.md|Connections\.csv)'
git grep -n -I -E 'password|api[_-]?key|secret|token' -- . ':!*.example*'
```

See [DATA_CONTRACT.md](DATA_CONTRACT.md) and [docs/PRIVATE_DATA_CHECKLIST.md](docs/PRIVATE_DATA_CHECKLIST.md).

## Quick start

Requirements:

- Node.js 22.6 or newer for the web dashboard
- an AI coding CLI such as Claude Code or Codex
- Playwright Chromium only when generating PDFs or using supported browser-assisted workflows

```bash
git clone <your-rolelinked-repository-url> rolelinked
cd rolelinked
npm install

cd web
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

For first-time personalization:

```bash
cp config/profile.example.yml config/profile.yml
cp templates/portals.example.yml portals.yml
```

Add a Markdown resume as `cv.md`, then open Claude Code or Codex in the repository and ask it to run RoleLinked onboarding. The compatibility command `/career-ops` remains available during the transition.

Codex reads [CODEX.md](CODEX.md) when it works in this repository. Slash commands are not guaranteed in every Codex client, so plain-language prompts are the portable interface:

```bash
codex
# Then prompt: Run RoleLinked scan mode

codex exec "Run RoleLinked tracker mode"
```

For LinkedIn, use the private offline export workflow in
[docs/LINKEDIN_INTEGRATION.md](docs/LINKEDIN_INTEGRATION.md). RoleLinked does
not scrape signed-in LinkedIn sessions.

## Major capabilities

| Area | What it provides |
|---|---|
| Discovery | Public ATS scans, supported job boards, configurable portals, filtering, deduplication, and scheduled scans |
| Evaluation | Structured A-H reports covering role fit, work-authorization signals, compensation research, posting legitimacy, and evidence-linked scoring |
| Applications | Tailored Markdown, HTML, PDF, and LaTeX resumes; cover letters; truthful form-answer drafts; RoleLinked never submits an application <!-- hitl: absolute guarantee. Do not add hedges such as automatically, by itself, or without your permission. --> |
| Tracking | Local application tracker, pipeline statuses, follow-ups, response history, analytics, and outcome records |
| Interviews | Company research, interview plans, practice, debriefs, story-bank matching, and skills-gap analysis |
| Integrations | Claude Code, Codex, other supported CLIs, optional plugins, and offline LinkedIn export utilities |

## Human-approval boundary

RoleLinked may prepare material, open a review surface, and recommend a next step. It must not:

- submit an application;
- send an email, LinkedIn message, or recruiter response;
- mark an application as submitted without the user's instruction;
- fabricate experience, metrics, education, work authorization, or authorship;
- publish private candidate data.

## Project structure

```text
web/                 Local dashboard
modes/               Agent workflow instructions
providers/           Job-source adapters
templates/           Resume, cover-letter, state, and configuration templates
data/                 Private runtime data (ignored except scaffolding)
reports/              Private evaluations (ignored)
output/               Private generated artifacts (ignored)
interview-prep/       Private interview material (ignored)
```

The current public codebase is the verified local-first foundation. Hosted
multi-user work is being introduced behind explicit storage, identity,
scheduler, and AI-provider interfaces so local mode remains fully supported.

## Contributing

RoleLinked welcomes improvements that make the project safer, easier to understand, and more useful across different careers. Please read [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), and [NOTICE.md](NOTICE.md).

Public contributions must use fictional fixtures and must not contain resumes, application records, recruiter messages, connection exports, credentials, or confidential employer information.

Career Ops upstream changes are reviewed through Git rather than applied
automatically. See [docs/UPSTREAM_SYNC.md](docs/UPSTREAM_SYNC.md).

When you are ready to create the public GitHub repository, follow
[docs/PUBLISHING.md](docs/PUBLISHING.md). The prepared checkout intentionally
has no `origin` remote, so nothing can be published accidentally.

## Brand

The RoleLinked name and teal/indigo visual identity distinguish this distribution from Career Ops. Compatibility names in environment variables and internal APIs are intentionally retained for now to avoid breaking existing local data and integrations. See [docs/BRANDING.md](docs/BRANDING.md).

## License and attribution

RoleLinked is distributed under the [MIT License](LICENSE). Substantial portions originate from Career Ops by Santiago Fernández de Valderrama and contributors. See [NOTICE.md](NOTICE.md) for the complete attribution statement.
