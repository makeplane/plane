# Phase 2: Backend -- Default View Seed + `is_default` Flag

## Context

- IssueView model: `apps/api/plane/db/models/view.py`
- WorkspaceViewViewSet: `apps/api/plane/app/views/view/base.py`
- IssueViewSerializer: `apps/api/plane/app/serializers/view.py`
- Workspace model: `apps/api/plane/db/models/workspace.py`

## Overview

Add `is_default` BooleanField to `IssueView`. Create a data migration seeding default "Daily Status" views for all existing workspaces. Add a `post_save` signal on Workspace to auto-create for new workspaces. Protect default views from deletion.

## Requirements

1. `is_default = BooleanField(default=False)` on IssueView
2. Data migration creates default view per existing workspace
3. Signal creates default view on new workspace creation
4. `destroy()` returns 400 if `is_default=True`
5. Default view config: name="Daily Status", spreadsheet layout, filters for today

## Architecture

<!-- Updated: Validation Session 1 - Verify today operator format from c0ae60711 before hardcoding filter strings -->

### Default View JSON Config

> ⚠️ **Before implementing**: grep c0ae60711 diff to find exact `today` operator format.
> The extended operators commit may use `"today"` as a standalone token or `"today;after_including;"` pattern.
> Use the verified format below:

```python
DEFAULT_VIEW_CONFIG = {
    "name": "Daily Status",
    "filters": {
        # TODO: verify exact format from extended operators (commit c0ae60711)
        # Options: "today" token OR "today;after_including;" pattern
        "start_date": ["today;after_including;"],
        "target_date": ["today;before_including;"],
    },
    "display_filters": {
        "layout": "spreadsheet",
        "order_by": "-created_at",
        "group_by": None,
        "sub_issue": True,
        "show_empty_groups": True,
    },
    "display_properties": {
        "assignee": True, "start_date": True, "due_date": True,
        "labels": False, "key": True, "priority": True, "state": True,
        "sub_issue_count": True, "link": False, "attachment_count": False,
        "estimate": False, "created_on": False, "updated_on": False,
        "modules": True, "cycle": True, "issue_type": False,
        # New CE properties
        "department_name": True, "project_name": True,
        "bank_wide_project": True, "progress_tracking": True,
        "completed_date": True, "reference_link": True, "total_log_time": True,
    },
}
```

### Signal Approach

<!-- Updated: Validation Session 2 - owned_by = workspace.owner (creator), no member query needed -->
<!-- Updated: Validation Session 3 - Signal goes in dedicated file, not in model file -->

`post_save` on `Workspace` model, `created=True` only. Uses `instance.owner` (workspace creator) as `owned_by` — always exists, no fallback query needed.

**Signal file**: Create `apps/api/plane/db/signals/workspace.py`. Import and connect in the app's `AppConfig.ready()` method (check `apps/api/plane/bgtasks/apps.py` or `apps/api/plane/app/apps.py` for existing pattern).

## Related Files

- `apps/api/plane/db/models/view.py`
- `apps/api/plane/app/views/view/base.py` (destroy methods)
- `apps/api/plane/app/serializers/view.py`
- `apps/api/plane/db/models/workspace.py`

## Implementation Steps

### 2.1 Add `is_default` field to IssueView

- Add `is_default = models.BooleanField(default=False)` after `is_locked`
- Create migration: `python manage.py makemigrations db`

### 2.2 Data migration for existing workspaces

- New migration file with `RunPython`
- Query all workspaces, batch-create IssueView with default config
- Use workspace creator as `owned_by`
- Set `access=1` (public), `is_default=True`

### 2.3 `post_save` signal on Workspace

- In `apps/api/plane/db/models/workspace.py` or a signals file
- On `created=True`: create default IssueView
- Use `instance.owner` (workspace creator) as `owned_by`

### 2.4 Protect deletion

- In `WorkspaceViewViewSet.destroy()`: check `workspace_view.is_default`
- Return 400 "Default views cannot be deleted" if True
- Same check in `IssueViewViewSet.destroy()` for safety

### 2.5 Expose `is_default` in serializer

- `IssueViewSerializer` uses `fields = "__all__"`, so auto-included
- Add `is_default` to `read_only_fields` list

### 2.6 Update `IWorkspaceView` type

- Add `is_default: boolean` to `packages/types/src/workspace-views.ts`

## Todo

- [ ] Add `is_default` field + migration
- [ ] Write data migration with batching (1000 workspaces per batch)
- [ ] Add `post_save` signal for new workspaces
- [ ] Add deletion guard in both ViewSet destroy methods
- [ ] Add `is_default` to serializer read_only_fields
- [ ] Add `is_default` to `IWorkspaceView` type

## Success Criteria

- All existing workspaces have exactly one default view
- New workspace auto-gets default view
- DELETE on default view returns 400
- `is_default` exposed in API response as read-only

## Risk Assessment

- **Large DB migration**: batch `RunPython` to avoid memory issues
- **Workspace without members**: signal needs fallback `owned_by` (workspace creator)
- **Idempotency**: data migration must skip workspaces that already have `is_default=True` view

## Security Considerations

- `is_default` must be read-only (cannot be set via API)
- Only backend can create default views

## Next Steps

Phase 3: ensure extended data (links, worklogs) available for spreadsheet
