# Phase 2 hosted setup

Phase 2 connects RoleLinked accounts to tenant-scoped data and private resume
storage. The application fails closed when a required hosted service is absent:
it does not fall back to a shared demo identity in production.

## Services used in this phase

- Clerk for account and session identity;
- Neon Postgres for profiles and resume metadata;
- Vercel Private Blob for resume files.

Upstash QStash and Workflow are reserved for hosted discovery and schedules in
Phases 3 and 4. Redshift is not required for transactional user data.

## Vercel environment variables

Configure these in the Vercel project for Production and Preview as needed.
Never paste their values into GitHub issues, commits, or documentation.

```text
ROLELINKED_DEPLOYMENT_MODE=hosted
NEXT_PUBLIC_APP_URL=https://rolelinked.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/app/today
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding
DATABASE_URL=...
DATABASE_URL_UNPOOLED=...
BLOB_READ_WRITE_TOKEN=...
QSTASH_TOKEN=...
QSTASH_CURRENT_SIGNING_KEY=...
QSTASH_NEXT_SIGNING_KEY=...
# Optional when the QStash project uses US East:
QSTASH_URL=https://qstash-us-east-1.upstash.io
```

Connecting Neon and a Private Blob store through the Vercel project normally
injects the database and Blob credentials. Verify the exact variable names in
Vercel after connecting each resource. QStash credentials come from the QStash
Quickstart page, not from an Upstash Redis database. Redis credentials are not
needed for Phase 2.

`DATABASE_URL` is the pooled runtime connection. `DATABASE_URL_UNPOOLED` is the
direct connection preferred for migrations. Keep both server-only; neither name
may use a `NEXT_PUBLIC_` prefix.

## Apply the database migrations

From the `web` directory, pull the encrypted project environment into an
ignored local environment file, then run the checked-in migrations:

```bash
vercel env pull .env.local
npm run db:migrate
```

The Drizzle configuration loads `.env.local` automatically. Do not commit that
file. The migrations create the Phase 2 tables, composite tenant foreign keys,
and forced Postgres row-level-security policies.

## Verify the first slice

1. Sign in with two separate Clerk test accounts.
2. Complete onboarding with different target roles for each account.
3. Upload one harmless test resume to each account.
4. Confirm each account can list and download only its own file.
5. Delete the test files and confirm they disappear from that account.
6. Run `npm run typecheck`, `npm test`, and `npm run build` from `web`.

Do not upload real resumes until the production database migration, private Blob
store, tenant-isolation check, and account-deletion workflow have all passed.
