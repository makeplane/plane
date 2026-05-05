# Bug Report: Time-Tracking Duplicate Work Items

**Date:** 2026-04-22  
**Reporter:** debugger  
**Severity:** High — duplicated rows in UI

---

## Executive Summary

When "Cross Workspaces" toggle is enabled on the My Timesheet page, some work items appear as **duplicate rows** in the table. Root cause is a Django ORM M2M join on `issue_assignees` that does not exclude soft-deleted rows (`deleted_at IS NOT NULL`), causing one issue to produce 2 rows when it has both an active and a soft-deleted assignee record for the same user.

---

## Bug Reproduction

- **URLs:**
  - Workspace-level: `http://localhost:3000/yesyes/time-tracking/`
  - Project-level: `http://localhost:3000/yesyes/projects/3e84f4aa-450d-4f61-87ee-530831bcba18/time-tracking`
- **Steps:** Enable "Cross Workspaces" toggle → observe row for issue "1. Create Projects 🎯" appears twice
- **User affected:** ngocyt004 (`c29ab8c4-1bce-41a7-b77c-5beb8d239744`)

---

## Timeline of Events

- **2026-04-21 06:40:53 UTC** — ngocyt004 was removed as assignee from issue `67e63877` ("1. Create Projects 🎯"). Django soft-deleted the `IssueAssignee` row (`deleted_at = 2026-04-21T06:40:53`).
- Later — ngocyt004 was re-added as assignee, creating a new active `issue_assignees` row (`deleted_at IS NULL`).
- Result: `issue_assignees` table now has TWO rows for `(issue=67e63877, assignee=ngocyt004)` — one soft-deleted, one active.

---

## SQL Evidence

### Confirming the Duplicate `issue_assignees` Rows

```sql
SELECT i.id, i.name, ia.deleted_at
FROM issues i
JOIN issue_assignees ia ON i.id = ia.issue_id
WHERE i.project_id = '3e84f4aa-450d-4f61-87ee-530831bcba18'
AND ia.assignee_id = 'c29ab8c4-1bce-41a7-b77c-5beb8d239744'
AND i.deleted_at IS NULL
ORDER BY i.name, ia.deleted_at NULLS LAST;
```

**Result (3 rows — issue 67e63877 appears TWICE):**

```
id                                   | name                  | deleted_at
67e63877-74b6-4ec4-8d96-e0d5076327c9 | 1. Create Projects 🎯 | 2026-04-21 06:40:53 ← soft-deleted
67e63877-74b6-4ec4-8d96-e0d5076327c9 | 1. Create Projects 🎯 | NULL                ← active
62c9d3b3-ac30-4dfd-8a5f-69dd7cfae67f | ok                    | NULL
```

### Cross-workspace query row count comparison

**Without filtering soft-deleted assignees (bug — what Django ORM generates):**

```sql
SELECT COUNT(*) FROM issues i
JOIN issue_assignees ia ON i.id = ia.issue_id
WHERE i.workspace_id IN ('8fabe863...', 'd0955718...')
AND ia.assignee_id = 'c29ab8c4...'
AND i.deleted_at IS NULL AND i.is_draft = false;
-- Result: 4 rows (includes duplicate of 67e63877)
```

**With filtering soft-deleted assignees (correct):**

```sql
SELECT COUNT(*) FROM issues i
JOIN issue_assignees ia ON i.id = ia.issue_id
WHERE i.workspace_id IN ('8fabe863...', 'd0955718...')
AND ia.assignee_id = 'c29ab8c4...'
AND ia.deleted_at IS NULL    -- ← this is what's missing
AND i.deleted_at IS NULL AND i.is_draft = false;
-- Result: 3 rows (correct, no duplicates)
```

---

## Root Cause

**File:** `apps/api/plane/app/views/workspace/time_tracking/cross_workspace.py`  
**Line:** 63 — `assignees=request.user`

**File:** `apps/api/plane/app/views/workspace/time_tracking/timesheet_grid.py`  
**Line:** 59 — `assignees=request.user`

Django's ORM translates `filter(assignees=request.user)` on a M2M field with a `through` model into a raw SQL JOIN on the `issue_assignees` table **without any filter on `issue_assignees.deleted_at`**. Django uses the table directly — not the model manager's `get_queryset()` (which would apply `SoftDeletionManager`'s `deleted_at__isnull=True` filter).

When `IssueAssignee` has both a soft-deleted row and an active row for the same `(issue, assignee)` pair (which happens when a user is removed then re-added as assignee), the JOIN produces two matching rows for that issue. The `.values()` call returns both rows, so the issue appears twice in `assigned_issues` list.

**Evidence chain:**

1. `IssueAssignee` uses soft-delete: `unique_together = ["issue", "assignee", "deleted_at"]` (line 393) — so same pair can exist with different `deleted_at` values
2. `SoftDeletionManager` (mixins.py:57) filters `deleted_at__isnull=True` — but Django M2M JOIN bypasses the manager
3. Cross-workspace endpoint (cross_workspace.py:60-75): `Issue.issue_objects.filter(assignees=request.user).values(...)` → duplicate rows in returned list
4. Frontend `TimesheetTable` renders `rows` from API response directly (no dedup) → duplicates shown in UI

**Why cross-workspace shows it more:** The toggling reloads data. The duplicate was already present in the project-level query too, but may have been less visible if the re-added assignee happened after the project page was last viewed, or if the user checked the project-level timesheet before the reassign/remove cycle occurred.

---

## Recommended Fix

**Two files need the same fix.**

### Fix 1: `cross_workspace.py` — `CrossWorkspaceTimesheetEndpoint`

Replace the M2M filter with an explicit subquery or use `.filter(issue_assignee__assignee=request.user, issue_assignee__deleted_at__isnull=True)` via the through table relation, OR add `.distinct()` plus the through-table constraint filter:

```python
# Option A (preferred): filter through the through-table relation with deleted_at guard
assigned_issues = list(
    Issue.issue_objects.filter(
        workspace_id__in=user_workspace_ids,
        issue_assignee__assignee=request.user,
        issue_assignee__deleted_at__isnull=True,  # ← exclude soft-deleted rows
    )
    .distinct()                                    # ← guard against any remaining joins
    .select_related("project", "workspace")
    .values(
        "id", "name", "sequence_id",
        "project__identifier", "project_id",
        "workspace__slug", "workspace__name",
    )
)
```

### Fix 2: `timesheet_grid.py` — `TimesheetGridEndpoint`

Same pattern on line 55-64:

```python
assigned_issues = (
    Issue.issue_objects.filter(
        workspace__slug=slug,
        project_id=project_id,
        issue_assignee__assignee=request.user,
        issue_assignee__deleted_at__isnull=True,  # ← exclude soft-deleted rows
    )
    .distinct()
    .select_related("project")
    .only("id", "name", "sequence_id", "project__identifier")
    .order_by("sequence_id")
)
```

### Why `.distinct()` alone is not enough

`.distinct()` without the `deleted_at` filter would still join soft-deleted rows — it just deduplicates. The correct approach is to exclude soft-deleted through-table rows first, then `.distinct()` as a safety net. Alternatively, rewrite using `IssueAssignee.objects.filter(...)` to get issue IDs (which correctly uses SoftDeletionManager), then `Issue.issue_objects.filter(id__in=...)`.

### Option B (subquery — avoids JOIN entirely):

```python
assigned_issue_ids = IssueAssignee.objects.filter(
    workspace_id__in=user_workspace_ids,
    assignee=request.user,
    # deleted_at IS NULL handled by SoftDeletionManager
).values_list("issue_id", flat=True)

assigned_issues = list(
    Issue.issue_objects.filter(
        id__in=assigned_issue_ids,
    )
    .select_related("project", "workspace")
    .values(...)
)
```

This is the safest approach — `IssueAssignee.objects` uses `SoftDeletionManager` which auto-filters `deleted_at IS NULL`.

---

## Environmental Factors

- Soft-delete pattern is used on `issue_assignees` but Django M2M joins bypass it
- Same bug exists in both project-level and workspace-level timesheet endpoints
- Only reproducible when a user has been removed-then-re-added as assignee on the same issue
- `unique_together = ["issue", "assignee", "deleted_at"]` constraint explicitly allows multiple rows for the same (issue, assignee) pair with different `deleted_at` values

---

## Recurrence Prevention

- All Django ORM M2M filters using `.filter(m2m_field=value)` where the through table has soft-delete should be audited and replaced with explicit through-table filters: `.filter(through_model__field=value, through_model__deleted_at__isnull=True)`
- Add a monitoring query: periodic check for issues with >1 row in assignee table per user (with at least one soft-deleted row) to catch future data inconsistencies

---

**Status:** DONE  
**Summary:** Root cause confirmed via DB query evidence. Django M2M join on `issue_assignees` skips soft-delete filter, returning duplicate rows when a user has both active and soft-deleted assignee records for the same issue. Two files affected: `cross_workspace.py:63` and `timesheet_grid.py:59`. Fix is to replace `assignees=request.user` with `issue_assignee__assignee=request.user, issue_assignee__deleted_at__isnull=True`.

---

## Unresolved Questions

1. Are there other views using `filter(assignees=...)` that have the same bug (e.g., workspace `base.py:310,317`)? A broader audit is recommended.
2. Should the `issue_assignees` table be cleaned up to remove stale soft-deleted rows that are older than N days?
