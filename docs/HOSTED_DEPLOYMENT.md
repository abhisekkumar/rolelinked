# Hosted deployment checklist

This is the operator checklist for taking RoleLinked from the local-first
repository to `rolelinked.com`. It intentionally contains names of secrets, not
secret values.

## 1. Publish the source safely

1. Run the checks in `docs/PRIVATE_DATA_CHECKLIST.md`.
2. Create a public GitHub repository named `rolelinked` under the intended owner.
3. Keep the original Career Ops repository as `upstream`; add the new repository
   as `origin`.
4. Push `main`, enable secret scanning and dependency alerts, then protect `main`.

Never point `origin` at the Career Ops upstream repository.

## 2. Create staging before production

- Import the GitHub repository into the chosen Next.js host.
- Use `web/` as the application root.
- Set `ROLELINKED_DEPLOYMENT_MODE=hosted` only in hosted environments.
- Deploy to a provider preview URL first, then attach
  `staging.rolelinked.com`.
- Keep `rolelinked.com` on its existing destination until the launch checklist
  passes.

## 3. Configure Clerk

Use an existing Clerk application selected by the owner. Configure sign-in and
sign-up URLs for staging, add production URLs later, and store these values in
the host's encrypted environment settings:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SIGNING_SECRET`

Do not paste secret keys into Git, issues, screenshots, chat logs, or client-side
JavaScript. Clerk integration must protect server routes as well as pages.

## 4. Provision tenant data

- Create separate staging and production PostgreSQL databases.
- Apply reviewed migrations through CI/deployment, never during a request.
- Require an authenticated owner filter for every user-owned query.
- Add automated cross-tenant denial tests before importing real resumes.
- Create separate private object-storage buckets or prefixes for staging and
  production; use short-lived signed URLs.
- Document backup, restore, export, and account-deletion procedures.

## 5. Add background work

- Create a durable queue/worker service for scans and document generation.
- Create one secured scheduler endpoint that periodically finds due schedules.
- Lease each due schedule transactionally before enqueueing work.
- Give every job an idempotency key and bounded retry policy.
- Store start, finish, provider errors, result counts, and next-run time.
- Never let a schedule imply permission to apply or send a message.

## 6. Add the hosted model gateway

- Keep model credentials server-side.
- Enforce per-user burst, daily, token, attachment, and concurrency limits.
- Put a hard global cost ceiling and emergency disable switch in place.
- Redact prompts, resumes, email content, and credentials from logs.
- Show users when the service is queued, rate-limited, or using a fallback model.

## 7. Production readiness gate

Before changing DNS for `rolelinked.com`, verify:

- two test accounts cannot read or mutate each other's records or files;
- account export and deletion complete successfully;
- scheduled scans run once in the chosen timezone and recover from a failure;
- duplicate scans do not create duplicate jobs or application rows;
- approval gates block submission and messaging paths;
- provider outages degrade safely and do not leak raw errors or secrets;
- backups restore into a clean environment;
- privacy policy, terms, acceptable-use rules, support contact, and incident
  process are published;
- monitoring and cost alerts reach the operator.

## 8. Domain cutover

After the production deployment is healthy:

1. Add `rolelinked.com` and `www.rolelinked.com` in the hosting provider.
2. Copy the exact DNS records the provider supplies into the domain registrar.
3. Verify TLS, Clerk production redirects, canonical URLs, email links, and
   webhook endpoints.
4. Keep the previous destination available until DNS and login are verified.
5. Publish the hosted beta as free with fair-use safeguards and keep the local
   installation instructions visible.
