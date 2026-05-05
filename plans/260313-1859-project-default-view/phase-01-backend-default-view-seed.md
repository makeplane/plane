# Phase 1: Backend — Default View Seed + Project Signal

## Context

- Parent plan: [plan.md](plan.md)
- IssueView model: `apps/api/plane/db/models/view.py`
- ProjectViewViewSet: `apps/api/plane/app/views/view/base.py`
- Project signals: `apps/api/plane/db/signals/project.py`
- Migration: `apps/api/plane/db/migrations/0148_seed_default_project_views.py`

## Overview

| Field       | Value                                      |
| ----------- | ------------------------------------------ |
| Date        | 2026-03-13                                 |
| Description | Seed Daily Status default view per project |
| Priority    | P1                                         |
| Status      | ✅ Done                                    |
| Review      | Pending                                    |

## Requirements

1. Data migration seeds one default view per existing project
2. `post_save` signal creates default view for new projects
3. Default view `display_properties`: 14 columns (no `department_name`, `project_name`)
4. `destroy()` in `IssueViewViewSet` returns 400 if `is_default=True`
5. `owned_by = project.created_by or project.workspace.owner`

## Architecture

### Default Project View Config

```python
DEFAULT_PROJECT_VIEW_DISPLAY_PROPERTIES = {
    # Standard properties
    "assignee": True, "start_date": True, "due_date": True,
    "labels": False, "key": True, "priority": True, "state": True,
    "sub_issue_count": True, "link": False, "attachment_count": False,
    "estimate": False, "created_on": False, "updated_on": False,
    "modules": True, "cycle": True, "issue_type": False,
    # CE extended — 5 of 7 enabled
    "bank_wide_project": True, "progress_tracking": True,
    "completed_date": True, "reference_link": True, "total_log_time": True,
    # Disabled for project scope (redundant)
    "department_name": False, "project_name": False,
}
```

### Signal File

`apps/api/plane/db/signals/project.py` — `post_save` on `db.Project`, `created=True` only.
Registered in `apps/api/plane/db/signals/__init__.py`.

### Migration 0148

- `RunPython(seed_default_project_views)` — idempotent (skip if `is_default` view exists for project)
- Batch size 500; `.iterator(chunk_size=500)` to avoid memory issues

## Related Files

- `apps/api/plane/db/migrations/0148_seed_default_project_views.py` ✅
- `apps/api/plane/db/signals/project.py` ✅
- `apps/api/plane/db/signals/__init__.py` ✅
- `apps/api/plane/app/views/view/base.py` (destroy guard — verify)

## Implementation Steps

### 1.1 Data migration (migration 0148)

- Query all non-deleted projects
- Skip if `is_default=True` view already exists for project
- Bulk create in batches of 500
- `owned_by = project.created_by or project.workspace.owner`

### 1.2 Post-save signal

- `@receiver(post_save, sender="db.Project")`
- On `created=True`: `IssueView.objects.create(...)` with default config
- Local import to avoid circular deps: `from plane.db.models import IssueView`

### 1.3 Deletion guard

- `IssueViewViewSet.destroy()`: check `view.is_default` → return 400 if True
- Already guarded in workspace view; verify project view destroy also checks

## Todo

- [x] Create `apps/api/plane/db/signals/project.py`
- [x] Register signal in `apps/api/plane/db/signals/__init__.py`
- [x] Write migration 0148 with batched RunPython
- [x] Verify `IssueViewViewSet.destroy()` guards project default views — **confirmed done** (Session 1: must fix if missing; Session 2: verified present) <!-- Updated: Validation Session 2 - delete guard confirmed done -->

## Success Criteria

- All existing projects have exactly one `is_default=True` view named "Daily Status"
- New project auto-gets default view on creation
- DELETE on default view returns 400
- `display_properties` has `department_name=False`, `project_name=False`

## Risk Assessment

- **Idempotency**: migration skips existing `is_default` views — no duplicates
- **`owned_by` fallback**: `project.created_by or workspace.owner` — always resolves
- **Circular import**: signal uses local import inside function body

## Security Considerations

- `is_default` is read-only; project signal bypasses API layer (safe)
- Default view config contains no user-supplied data

## Next Steps

Phase 2: frontend UI for project views page
