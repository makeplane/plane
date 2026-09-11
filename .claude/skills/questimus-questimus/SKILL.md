---
name: questimus-questimus
description: "Work on Questimus tickets and plans in Questimus: read the HANDOFF page (if present), list/create/update/comment on/resolve work-items in the Questimus project via the Questimus REST API (scoped to project ca67c7ab-6b87-454e-be68-e1a6cc9c2fe3 in workspace main)."
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
triggers:
  - questimus
  - work on next ticket
  - work on tickets
  - triage reports
  - resolve issues
  - read the handoff
  - what is in the plan
---

# Questimus — Questimus project skill

This skill is the interface to the **Questimus** project in Questimus. It is deployed per-project: only this skill is present in the Questimus context, so generic triggers apply. The project name appears in the description only (for disambiguation in sessions that carry multiple questimus skills).

## How to use this skill

- **Read the routes on demand** — this file is the orchestrator; the exact recipes live in `references/`:
  - `references/route-meta.md` — states/labels/types UUIDs (hardcoded) + re-resolve fallback
  - `references/route-plan.md` — the plan structure
  - `references/route-ticket.md` — tickets: list/read/create/update/comment/search/delete + field semantics
- **Prefer the CLI** — `scripts/questimus.js` wraps the API (auth, UUID resolution, clean output). Raw API calls are documented in the routes as fallback. Recipes below run `node scripts/questimus.js` from the skill base dir; with a project-scoped deployment the full path is `.agents/skills/questimus-questimus/scripts/questimus.js` (or `.claude/skills/…`/`.dsh/skills/…` per harness).

## Scope

- **Workspace:** `main` Â· **Project:** `Questimus` (id `ca67c7ab-6b87-454e-be68-e1a6cc9c2fe3`)
- **Base URL:** `http://localhost:7000`
- **Token:** read from `.token` in this skill folder (gitignored; deployed by `Arsenal/scripts/deploy-tokens.ps1`). Never print, never commit, never paste into chat.
- **Auth:** `X-Api-Key` header. The `.token` file already holds the full value (including the `plane_api_` prefix) and the CLI sends it verbatim — never prefix it again. Rate limit 60/min per token (local install raised to 1000/min).
- **Token scope:** read/write ONLY the Questimus project. 401/403 = wrong token or missing membership — stop and report.

## Conventions

- **States (6):** `Backlog` Â· `In Progress` Â· `Done` Â· `Cancelled` Â· `Blocked` Â· `ToDo` — UUIDs in route-meta.
- **Types (3):** `Plan` (hierarchy) Â· `Ticket` (default) Â· `Design` (design/UI-UX work items) — UUIDs in route-meta.
- **Labels:** `todo`, `idea`, `user-report`, `verified` — UUIDs in route-meta.
- **Priorities:** `urgent | high | medium | low`.
- **Identifiers:** zero-padded keys (`QUESTIMUS-001`) in the UI; the API accepts the raw sequence (`QUESTIMUS-7`).
- **Descriptions are HTML** — the CLI converts markdown for you (`--desc-md` or `--desc-file`); raw API calls must send `description_html`.

## Workflows

### Start a session
1. Read the **HANDOFF page** (`node scripts/questimus.js handoff`) — the single working record of open work. If absent, it prints `HANDOFF page not found` and exits 1.
2. Read the plan structure (`node scripts/questimus.js plan`) to see what's next.

### End a session
1. Write your run-state summary to the **HANDOFF page**: `node scripts/questimus.js handoff --write-file run-state.md` (or `--write-md "…"` / `--write-html "…"`). Creates the page if missing, updates it if present.

### Triage a user report
1. List `user-report`-labeled issues: `node scripts/questimus.js list --label user-report`.
2. Reproduce/assess; dedupe via `search`; set priority; move to **ToDo** (triage does NOT start work).
3. Comment with the triage result.

### Work on a ticket
1. Read the ticket (`get`) and its context (related tickets via `search`).
2. Move to **In Progress** (`update --state In Progress`), do the work, comment progress.
3. Verify against the ticket's DoD; move to **Done** and add label `verified`.

### Resolve a user report
1. Confirm the fix; comment with the resolution; move to **Done**.
2. Not reproducible: comment and move to **Blocked** or **Cancelled**.

### Create a ticket (new work / ideas)
1. `search` first (dedupe).
2. `create --name … --desc-md … --state Backlog --priority … --type Ticket [--label …]` — use `--desc-file <path>` when the description contains quotes or special characters (shell quoting mangles `--desc-md`).

## Rules

- Never print or commit the token; never paste it into chat.
- Prefer the CLI; keep payloads minimal.
- 401/403 → token wrong or lacks membership — stop and report, no workarounds.
- 409 on create with external ids → already exists — reuse; without external ids → unexpected, report.
- 429 → the CLI retries 3× with backoff; if it still fails, report to the user.
- Delete is permanent — only with explicit user confirmation; prefer `Cancelled`.
- The v1 list endpoint ignores filters — use the CLI `list` (JSON filters) for any filtered listing.

## Post-run review

After finishing a work session with this skill (any real work done — triage, ticket work, plan/HANDOFF updates), run the **post-run-review** skill against this run: it checks the run against this skill's spec (stale UUIDs, changed endpoints, broken recipes) and returns a recommendation-only verdict. Report the verdict to the user. This keeps the skill from silently rotting as Questimus changes.
