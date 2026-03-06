---
parent: ./plan.md
status: pending
---

# Phase 01 — Fix Backend Count Queries

## Overview

- **Date:** 2026-03-05
- **Priority:** P2
- **Status:** pending

## Context

Sub-issues (child issues) have a non-null `parent_id`. The existing `IssueManager` does NOT exclude them. Other views already use `.filter(parent__isnull=True)` to exclude sub-issues (e.g., archive, cycle, module views). We need to apply the same pattern to assigned-count queries.

## Related Code Files

| File                                         | Lines   | Description                                      |
| -------------------------------------------- | ------- | ------------------------------------------------ |
| `apps/api/plane/app/views/workspace/base.py` | 292–302 | Dashboard: assigned/pending/completed counts     |
| `apps/api/plane/app/views/workspace/user.py` | 307–315 | Project-level stats annotation                   |
| `apps/api/plane/app/views/workspace/user.py` | 448–481 | Profile stats: assigned/pending/completed counts |

## Implementation Steps

### Fix 1 — `base.py` line 292

**Current:**

```python
assigned_issues = Issue.issue_objects.filter(workspace__slug=slug, assignees__in=[request.user]).count()
```

**Change to:**

```python
assigned_issues = Issue.issue_objects.filter(workspace__slug=slug, assignees__in=[request.user], parent__isnull=True).count()
```

Also apply same `parent__isnull=True` to `pending_issues_count` (line 294) and `completed_issues_count` (line 300) for consistency.

---

### Fix 2 — `user.py` lines 307–315 (project-level annotation)

**Current:**

```python
.annotate(
    assigned_issues=Count(
        "project_issue",
        filter=Q(
            project_issue__assignees__in=[user_id],
            project_issue__archived_at__isnull=True,
            project_issue__is_draft=False,
        ),
    )
)
```

**Add** `project_issue__parent__isnull=True` to the Q() filter.

---

### Fix 3 — `user.py` lines 448–481 (profile stats)

Add `parent__isnull=True` to the filter for:

- `assigned_issues_count` (line 448)
- `pending_issues_count` (line 459)
- `completed_issues_count` (line 471)

## Todo

- [ ] Fix `base.py`: add `parent__isnull=True` to assigned/pending/completed counts (lines 292, 294, 300)
- [ ] Fix `user.py`: add `project_issue__parent__isnull=True` to project annotation (line 307)
- [ ] Fix `user.py`: add `parent__isnull=True` to profile stats counts (lines 448, 459, 471)
- [ ] Verify no frontend/type changes needed

## Success Criteria

- "Work items assigned" stat shows only top-level issues
- Sub-issues assigned to user no longer inflate the count
- Pending and completed assigned counts are consistent

## Risk Assessment

- **Low** — additive filter only, no schema changes, no API contract changes
- Backend-only change, no frontend impact

## Security Considerations

- None — read-only query filter change
