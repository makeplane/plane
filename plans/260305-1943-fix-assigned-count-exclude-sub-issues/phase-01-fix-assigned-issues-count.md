---
parent: ./plan.md
status: completed
---

# Phase 01 — Fix assigned_issues Count Queries

## Overview

- **Date:** 2026-03-05
- **Priority:** P2
- **Status:** completed

## Key Insights

- Sub-issues have non-null `parent_id`; top-level issues have `parent=None`
- Pattern `parent__isnull=True` already used in archive/cycle/module views
- Only fix `assigned_issues` count — leave `pending_issues`/`completed_issues`/distributions untouched

## Related Code Files

| File                                         | Lines   | Description                                |
| -------------------------------------------- | ------- | ------------------------------------------ |
| `apps/api/plane/app/views/workspace/base.py` | 292     | Dashboard: `assigned_issues` count         |
| `apps/api/plane/app/views/workspace/user.py` | 307–315 | Project-level `assigned_issues` annotation |
| `apps/api/plane/app/views/workspace/user.py` | 448–457 | Profile stats: `assigned_issues_count`     |

## Implementation Steps

### Fix 1 — `base.py` line 292

```python
# Before
assigned_issues = Issue.issue_objects.filter(
    workspace__slug=slug, assignees__in=[request.user]
).count()

# After
assigned_issues = Issue.issue_objects.filter(
    workspace__slug=slug, assignees__in=[request.user], parent__isnull=True
).count()
```

### Fix 2 — `user.py` lines 307–315 (project annotation)

```python
# Before
assigned_issues=Count(
    "project_issue",
    filter=Q(
        project_issue__assignees__in=[user_id],
        project_issue__archived_at__isnull=True,
        project_issue__is_draft=False,
    ),
)

# After — add parent filter
assigned_issues=Count(
    "project_issue",
    filter=Q(
        project_issue__assignees__in=[user_id],
        project_issue__parent__isnull=True,
        project_issue__archived_at__isnull=True,
        project_issue__is_draft=False,
    ),
)
```

### Fix 3 — `user.py` lines 448–457 (profile stats)

```python
# Before
assigned_issues_count = (
    Issue.issue_objects.filter(
        (Q(assignees__in=[user_id]) & Q(issue_assignee__deleted_at__isnull=True)),
        workspace__slug=slug,
        project__project_projectmember__member=request.user,
        project__project_projectmember__is_active=True,
    )
    .filter(**filters)
    .count()
)

# After — add parent__isnull=True
assigned_issues_count = (
    Issue.issue_objects.filter(
        (Q(assignees__in=[user_id]) & Q(issue_assignee__deleted_at__isnull=True)),
        workspace__slug=slug,
        parent__isnull=True,
        project__project_projectmember__member=request.user,
        project__project_projectmember__is_active=True,
    )
    .filter(**filters)
    .count()
)
```

## Todo

- [x] `base.py` line 292: add `parent__isnull=True`
- [x] `user.py` lines 307–315: add `project_issue__parent__isnull=True` to annotation Q()
- [x] `user.py` lines 448–457: add `parent__isnull=True` to profile stats filter

## Success Criteria

- "Work items assigned" shows only top-level issues assigned to user
- Sub-issues no longer inflate the count
- `pending_issues` / `completed_issues` / distributions unchanged

## Risk Assessment

- **Low** — additive read-only filter; no schema or API contract changes
- No frontend changes needed
