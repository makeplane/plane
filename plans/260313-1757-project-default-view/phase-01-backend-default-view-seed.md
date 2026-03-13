# Phase 1: Backend -- Default View Seed + `is_default` Flag (Project Scope)

## Context

- IssueView model: `apps/api/plane/db/models/view.py`
- ProjectViewViewSet: `apps/api/plane/app/views/view/base.py` (look for `ProjectViewViewSet`)
- IssueViewSerializer: `apps/api/plane/app/serializers/view.py`
- Project model: `apps/api/plane/db/models/project.py`
- Existing workspace signal: `apps/api/plane/db/signals/workspace.py` (reference pattern)

## Overview

`IssueView` already has `is_default` (added in migration 0145 for the workspace plan). This phase creates a data migration seeding default "Daily Status" project views for all **existing** projects, and adds a `post_save` signal on the `Project` model to auto-create for new projects. Also protects project default views from deletion.

> ⚠️ `IssueView.is_default` already exists (migration 0145). **Do NOT re-add the field.** Skip to step 1.2.

## Requirements

1. Data migration creates one default IssueView per existing project (`project=<id>`)
2. `post_save` signal on `Project` auto-creates default view on project creation
3. `ProjectViewViewSet.destroy()` returns 400 if `is_default=True`
4. Default view config: name="Daily Status", spreadsheet layout, 14 columns enabled

## Architecture

### Default View JSON Config

```python
DEFAULT_PROJECT_VIEW_CONFIG = {
    "name": "Daily Status",
    "filters": {},  # No date filter — show all project issues
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
        # CE properties — only 5 of the 7 (no department_name, project_name)
        "bank_wide_project": True, "progress_tracking": True,
        "completed_date": True, "reference_link": True, "total_log_time": True,
        # Explicitly disabled in project views
        "department_name": False, "project_name": False,
    },
}
```

### Signal Approach

`post_save` on `Project` model, `created=True` only. Uses `instance.created_by` as `owned_by` — always set, no fallback query needed.

**Signal file**: Create `apps/api/plane/db/signals/project.py`. Copy pattern from `workspace.py`. Import and connect in `AppConfig.ready()`.

## Related Files

- `apps/api/plane/db/models/view.py` — IssueView model (is_default already there)
- `apps/api/plane/app/views/view/base.py` — ProjectViewViewSet.destroy()
- `apps/api/plane/app/serializers/view.py` — IssueViewSerializer
- `apps/api/plane/db/models/project.py` — Project model
- `apps/api/plane/db/signals/workspace.py` — reference implementation
- `apps/api/plane/db/signals/project.py` — [NEW]

## Implementation Steps

### 1.1 Verify `is_default` already on IssueView

- Grep `view.py` for `is_default` — should exist from migration 0145
- If missing, add `is_default = models.BooleanField(default=False)` and create migration

### 1.2 Data migration for existing projects

- Create new migration file (next number after 0146)
- Query all projects that do NOT already have a default view
- Batch-create IssueView records with `DEFAULT_PROJECT_VIEW_CONFIG`
- Set `project=project_instance`, `workspace=project.workspace`
- Set `owned_by=project.created_by`, `access=1` (public), `is_default=True`
- Batch size: 500 projects per chunk

```python
def seed_default_project_views(apps, schema_editor):
    Project = apps.get_model("db", "Project")
    IssueView = apps.get_model("db", "IssueView")
    views_to_create = []
    for project in Project.objects.select_related("workspace", "created_by").iterator(chunk_size=500):
        if IssueView.objects.filter(project=project, is_default=True).exists():
            continue
        views_to_create.append(IssueView(
            name="Daily Status",
            description="",
            project=project,
            workspace=project.workspace,
            owned_by=project.created_by,
            filters={},
            display_filters=DEFAULT_PROJECT_VIEW_CONFIG["display_filters"],
            display_properties=DEFAULT_PROJECT_VIEW_CONFIG["display_properties"],
            access=1,
            is_default=True,
        ))
    IssueView.objects.bulk_create(views_to_create, batch_size=500)
```

### 1.3 `post_save` signal on Project

- File: `apps/api/plane/db/signals/project.py`
- Pattern: mirror `workspace.py` signal
- On `created=True`: create IssueView with project-scoped config
- Register in `AppConfig.ready()`

```python
from django.db.models.signals import post_save
from django.dispatch import receiver
from plane.db.models import Project, IssueView

@receiver(post_save, sender=Project)
def create_default_project_view(sender, instance, created, **kwargs):
    if not created:
        return
    IssueView.objects.create(
        name="Daily Status",
        project=instance,
        workspace=instance.workspace,
        owned_by=instance.created_by,
        filters={},
        display_filters=DEFAULT_PROJECT_VIEW_CONFIG["display_filters"],
        display_properties=DEFAULT_PROJECT_VIEW_CONFIG["display_properties"],
        access=1,
        is_default=True,
    )
```

### 1.4 Protect deletion in ProjectViewViewSet

- Find `ProjectViewViewSet.destroy()` in `apps/api/plane/app/views/view/base.py`
- Check `project_view.is_default` before deletion
- Return `Response({"error": "Default views cannot be deleted"}, status=400)` if True

### 1.5 Expose `is_default` in serializer

- `IssueViewSerializer` uses `fields = "__all__"` → already included automatically
- Verify `is_default` is in `read_only_fields` (may have been added in workspace plan)

### 1.6 Update `IProjectView` type

- Verify `is_default: boolean` in `packages/types/src/project/` view type
- If workspace plan already added it to base `IIssueView` type, it inherits — check

## Todo

- [ ] Verify `is_default` on IssueView model (skip migration if already there)
- [ ] Write data migration for existing projects
- [ ] Create `apps/api/plane/db/signals/project.py`
- [ ] Register signal in AppConfig.ready()
- [ ] Add deletion guard in ProjectViewViewSet.destroy()
- [ ] Verify `is_default` in serializer read_only_fields
- [ ] Verify `IProjectView` type includes `is_default`

## Post-Phase Checklist

- [ ] `python manage.py migrate` runs without error
- [ ] All existing projects have exactly one `is_default=True` view
- [ ] `POST /api/v1/workspaces/{slug}/projects/` → new project → default view auto-created
- [ ] `DELETE /api/v1/workspaces/{slug}/projects/{id}/views/{defaultId}/` → 400
- [ ] `GET /api/v1/workspaces/{slug}/projects/{id}/views/` → `is_default` field present

## Success Criteria

- All existing projects have exactly one default view
- New project auto-gets default view
- DELETE on default view returns 400
- `is_default` exposed in API response as read-only

## Risk Assessment

- **Low risk on is_default field**: already exists from workspace plan — verify before migrating
- **Project.created_by null edge case**: some projects may have `created_by=None` (deleted user) — use workspace owner as fallback
- **Idempotency**: data migration must skip projects that already have `is_default=True` view

## Security Considerations

- `is_default` must be read-only (cannot be set via API PATCH/PUT)
- Only backend/signal can create default views

## Next Steps

Phase 2: ensure extended data (links, worklogs) available for project issues
