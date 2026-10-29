---
name: rolelinked
description: >-
  Local-first AI career command center for job discovery, truthful application
  preparation, pipeline tracking, interview preparation, and resume generation.
  Use when the user asks to run a RoleLinked career workflow.
arguments: mode
user_invocable: true
user-invocable: true
argument-hint: "[scan | discover | pipeline | apply | pdf | latex | tracker | followup | interview-prep | interview | outcome]"
license: MIT
---

# RoleLinked router

RoleLinked currently preserves the mature Career Ops workflow router for
compatibility. Before acting, read `../career-ops/SKILL.md` completely and
follow it, treating every occurrence of the product-facing name `career-ops`
as `RoleLinked` while retaining command, file, and environment-variable names
that are required for compatibility.

Resolve the project root by walking upward from this file until the nearest
directory containing both `AGENTS.md` and `modes/`. Follow the RoleLinked
distribution override at the top of `AGENTS.md`: never use the Career Ops
self-updater to update RoleLinked, and never weaken its privacy or human
approval boundaries.

The requested `$mode` maps to the same mode in the compatibility router. A job
description or job URL with no named mode maps to `auto-pipeline`.
