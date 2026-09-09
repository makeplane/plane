# Route: tickets & work items (Questimus)

Tickets are work items (type Ticket by default). Questimus specifics: identifier prefix `QUESTIMUS`.

## Read

```
node scripts/questimus.js get QUESTIMUS-123     # by identifier (or uuid)
node scripts/questimus.js list                  # all (per_page=1000 — projects fit in one call)
node scripts/questimus.js list --state Done --type Ticket --label SP-04 --priority high
node scripts/questimus.js list --assignee karol # assigned to Karol
node scripts/questimus.js subs <id>            # children (only hierarchy items have them)
node scripts/questimus.js search <query>       # name / sequence / identifier
```

## Create a ticket

```
node scripts/questimus.js create --name "Title" --desc-md "**What:** …" --state Backlog --priority medium --type Ticket [--label …]
```

- **Search first** (dedupe) before creating.
- `--desc-md` converts markdown; `--desc-html` passes HTML through.
- `--ext-source`/`--ext-id` are optional (idempotency for app reports).

## Update (partial — only send what changes)

```
node scripts/questimus.js update <id> --state In Progress
node scripts/questimus.js update <id> --state Done --label verified
node scripts/questimus.js update <id> --priority high
```

## Comment

```
node scripts/questimus.js comment <id> "Triage: reproduced, root cause …, moving to ToDo."
```

## Delete (PERMANENT — only with explicit user confirmation)

```
node scripts/questimus.js delete <id> --yes
```

Deletion is permanent and only allowed for the item creator or an admin. Prefer `Cancelled` state over delete unless the item is truly wrong.

## Relations

```
POST /api/v1/workspaces/main/projects/ca67c7ab-6b87-454e-be68-e1a6cc9c2fe3/work-items/{wid}/relations/
{ "relation_type": "blocked_by|blocking|duplicate|relates_to", "issues": ["<target-id>"] }
```

## Raw API (fallback)

```
GET    /api/v1/workspaces/main/work-items/QUESTIMUS-123/          # detail (state/type/labels = UUIDs)
PATCH  /api/v1/workspaces/main/projects/ca67c7ab-6b87-454e-be68-e1a6cc9c2fe3/work-items/{wid}/   # partial update
POST   /api/v1/workspaces/main/projects/ca67c7ab-6b87-454e-be68-e1a6cc9c2fe3/work-items/          # create
POST   …/work-items/{wid}/comments/   { "comment_html": "…" }
GET    …/work-items/{wid}/comments/                               # read the discussion
GET    /api/v1/workspaces/main/work-items/search/?search=…         # → { issues: […] } (field is "issues")
GET    /api/workspaces/main/projects/ca67c7ab-6b87-454e-be68-e1a6cc9c2fe3/issues/?filters={json}  # filtered list (JSON filters param!)
DELETE …/work-items/{wid}/                                        # permanent
```

## Field semantics

- **v1 detail:** `state`, `type`, `labels`, `assignees`, `parent` are **UUIDs**; `description_html` is HTML.
- **main API list:** `type_id`, `state_detail.name`, `labels`/`assignees` are objects; `state_id`; `parent_id`.
- **Filtering:** only the main API list filters, via the **JSON `filters` query param** (URL-encoded): `{"state_id__in":[…], "label_id__in":[…], "assignee_id__in":[…], "priority__in":[…], "issue_type__in":[…]}` with `and`/`or`/`not`. Flat params are ignored. `total_count` is the **unfiltered** project total — trust `results`.
- **Pagination:** `per_page` default/max 1000; paginate via `next_cursor` only if a project exceeds 1000.
- **409 on create** happens only with `external_source`+`external_id` that already exist (idempotency) — reuse the returned id. Without external ids a 409 is unexpected — report it.
- **429:** the script retries 3× with backoff; if it still fails, report to the user.
