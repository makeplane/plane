---
name: questimus-{{project-slug}}
description: "Work on {{project-name}} tickets in Questimus: list, create, update, comment on, and resolve work-items in the {{project-name}} project via the Questimus REST API. Scoped to project {{project-id}} in workspace {{workspace-slug}}."
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
  - WebFetch
triggers:
  - questimus {{project-slug}}
  - work on {{project-name}} tickets
  - triage {{project-name}} reports
  - resolve {{project-name}} issues
---

# Questimus — {{project-name}} project skill

## Scope

- **Workspace:** `{{workspace-slug}}` · **Project:** `{{project-name}}` (id `{{project-id}}`)
- **Base URL:** `{{base-url}}` (local: `http://localhost:7000`)
- **Token:** env var `QUESTIMUS_{{PROJECT_ENV}}_AGENT_TOKEN` — never hardcode, never print, never log.
- **Auth:** `X-Api-Key: plane_api_<token>` header. Rate limit 60/min per token.

## Conventions

- **States:** Open · In Progress · Blocked · Cancelled · Done
- **Types:** Plan (root) → Subplan → Task → Subtask (nested hierarchy); **Ticket** (separate, no parent)
- **Labels:** `user-report` (app-reported issues), `verified`, `SP-XX` (ticket grouping)
- **Priorities:** urgent | high | medium | low
- **Issue identifiers:** `<PROJECT_IDENTIFIER>-<sequence>` (e.g. `LEGALIOSA-123`)

## Endpoints (v1 API, X-Api-Key)

```
GET    /api/v1/workspaces/{slug}/projects/{id}/work-items/          list (NO filters — the v1 list ignores filter params)
GET    /api/workspaces/{slug}/projects/{id}/issues/                 list WITH filters (state, labels, assignees, priority, issue_type) — main API, token works after the fork change
POST   /api/v1/workspaces/{slug}/projects/{id}/work-items/          create
GET/PATCH/DELETE /api/v1/workspaces/{slug}/projects/{id}/work-items/{wid}/
GET    /api/v1/workspaces/{slug}/work-items/{identifier}-{seq}/     by identifier (e.g. LEG-123)
GET    /api/v1/workspaces/{slug}/work-items/search/?search=...      search
POST   .../work-items/{wid}/comments/          { comment_html }
POST   .../work-items/{wid}/relations/         { relation_type, issues: [ids] }
POST   .../work-items/{wid}/attachments/       multipart (name, type, size, file)
GET    /api/v1/workspaces/{slug}/projects/{id}/states/
GET    /api/v1/workspaces/{slug}/projects/{id}/labels/
```

Create payload: `name`, `description_html` (HTML), `state` (state UUID), `priority`,
`labels` (label UUIDs), `external_source`/`external_id` (optional, for idempotency).

Pages (plan docs) live on the main API: `GET/POST /api/workspaces/{slug}/projects/{id}/pages/`
(works with the same token after the fork change).

## Workflows

### Triage user reports
1. List issues with the main API: `GET /api/workspaces/{slug}/projects/{id}/issues/?labels=<user-report-id>&state=<open-id>` (resolve the label/state ids via the v1 states/labels endpoints).
2. Reproduce or assess; dedupe via search; set priority; move to In Progress.
3. Comment on the issue with the triage result.

### Work on a ticket
1. Read the ticket (description_html → markdown) and its plan hierarchy (the Plan/Subplan issues above it).
2. Move to In Progress, do the work, comment progress.
3. Verify against the ticket's DoD; move to Done; add label `verified`.

### Resolve a user report
1. Confirm the fix; comment with the resolution; move to Done.
2. If not reproducible: comment and move to Blocked or Cancelled.

## Rules

- Never print or commit the token.
- Prefer PATCH for partial updates; keep payloads minimal (token efficiency).
- If a call fails with 401/403, the token is wrong or lacks project membership — stop and report.
- If a call fails with 409 on create, the work-item already exists (external_source+external_id) — treat as done.
