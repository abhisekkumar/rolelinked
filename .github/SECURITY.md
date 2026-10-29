# Security Policy

## Reporting a Vulnerability

**Do NOT open a public issue for security vulnerabilities.**

Use this repository's **Security** tab and select **Report a vulnerability** to
open a private security advisory. If private vulnerability reporting is not yet
enabled, do not publish the details; open a minimal public issue asking the
maintainers to enable a private reporting channel.

Include:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

The maintainers will work with you to understand and address the issue before
public disclosure. Please do not include real resumes, application records,
credentials, session tokens, or other candidate data in a report; use synthetic
fixtures and redact logs.

## Scope

Security issues in the following are in scope:

- **Scripts** (`*.mjs`) — command injection, path traversal, SSRF
- **Dashboard** (`dashboard/`) — any Go binary vulnerabilities
- **Web dashboard** (`web/`) — anything reachable while it is running, including cross-origin requests from a page the user visits, requests from other hosts on the same network, and command injection through its API
- **Templates** (`templates/`) — XSS in generated HTML/PDF
- **Configuration** — secrets exposure, unsafe defaults
- **Hosted service** — authentication/authorization bypass, cross-tenant data
  access, insecure object access, webhook forgery, scheduler isolation, and
  approval-gate bypass

## Out of Scope

- Issues in third-party dependencies (report upstream)
- Issues requiring physical access to the user's machine
- Social engineering attacks
- Volumetric denial-of-service tests against production infrastructure without
  prior written authorization

**"Local" does not mean "unreachable".** The self-hosted dashboard is a local
HTTP server, and a local server is still reachable by a cross-origin page the
user visits and, when deliberately exposed, by devices on the same network. If
an issue needs nothing more than the user running RoleLinked and browsing
normally, it is in scope.

## Disclosure Policy

We follow coordinated disclosure. Once a fix is released, we will credit the reporter (unless they prefer anonymity) in the release notes.
