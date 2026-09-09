# Route: plan structure (Questimus)

This project tracks Questimus itself: the migration plan (Plan issue) + feature/dev tickets. No SP/T hierarchy.

## Read it

```
node scripts/questimus.js plan            # active plan root (Plan type, no parent, not Done)
node scripts/questimus.js plan --full    # + children (recursive, where a hierarchy exists)
node scripts/questimus.js list --type Plan   # all Plan-typed issues (flat projects)
```

## Raw API (fallback)

```
GET /api/workspaces/main/projects/ca67c7ab-6b87-454e-be68-e1a6cc9c2fe3/issues/?filters={"issue_type__in":["c163bb6f-cdcf-4ec9-b04e-5cbbfbea86b1"]}&per_page=1000
GET /api/workspaces/main/projects/ca67c7ab-6b87-454e-be68-e1a6cc9c2fe3/issues/{id}/sub-issues/   # children of any work item
GET /api/v1/workspaces/main/work-items/QUESTIMUS-7/                       # detail by identifier
```
