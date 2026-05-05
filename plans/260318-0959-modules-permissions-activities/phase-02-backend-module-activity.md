# Phase 2: Backend Module Activity

## Context Links

- [Plan Overview](plan.md)
- No dependencies (parallel with Phase 1)
- Reference: `IssueActivity` model in `apps/api/plane/db/models/issue.py`

## Overview

- **Priority**: P2
- **Status**: completed
- **Effort**: 3h
- **Description**: Create `ModuleActivity` model, log activities on module mutations, and expose a list API endpoint.

## Key Insights

- `IssueActivity` is complex (comment, attachments, issue_comment FK). Module activities need only: actor, verb, field, old_value, new_value, epoch.
- Current module mutations already call `model_activity.delay()` for webhooks. Activity logging should happen alongside.
- Activities to track: created, name updated, description updated, status changed, dates changed, lead changed, members added/removed, work items added/removed, archived, unarchived, deleted.
- Keep it simple: log in-view after each mutation. No Celery task needed for internal activity log.
- `ProjectBaseModel` provides: workspace, project, created_by, updated_by, created_at, updated_at, deleted_at.

## Requirements

- `ModuleActivity` model with: module FK, actor FK, verb, field, old_value, new_value, epoch
- Activity records created after each module mutation (create, update, delete, archive, unarchive, member changes, work item changes)
- GET endpoint to list activities for a module, paginated, ordered by `-created_at`
- Accessible to all project members (read-only)

## Architecture

```
ModuleActivity (ProjectBaseModel)
├── module: FK -> Module (CASCADE)
├── actor: FK -> User (SET_NULL, null=True)
├── verb: CharField (created, updated, deleted, archived, unarchived)
├── field: CharField (nullable -- e.g., "name", "status", "lead", "members", "work_items")
├── old_value: TextField (nullable)
├── new_value: TextField (nullable)
├── epoch: FloatField (nullable)
```

**Activity logging approach**: Helper function `log_module_activity()` called in views after mutations. Accepts module, actor, verb, field, old/new values. Creates `ModuleActivity` record directly (synchronous, fast single INSERT).

**API endpoint**: `GET /api/workspaces/:slug/projects/:project_id/modules/:module_id/activities/`

- Pagination via cursor-based pagination (existing `BaseAPIView.paginate`)
- Permission: `ProjectEntityPermission` (any member can read)

## Related Code Files

- **Modify**: `apps/api/plane/db/models/module.py` -- add `ModuleActivity` class
- **Modify**: `apps/api/plane/db/models/__init__.py` -- export `ModuleActivity`
- **Modify**: `apps/api/plane/app/views/module/base.py` -- log activities after mutations
- **Modify**: `apps/api/plane/app/views/module/issue.py` -- log activities for work item add/remove
- **Modify**: `apps/api/plane/app/views/module/archive.py` -- log activities for archive/unarchive
- ~~**Modify**: `apps/api/plane/api/views/module.py` -- log activities in API views~~ (removed per Validation Session 1)
<!-- Updated: Validation Session 1 - API views excluded from activity logging -->
- **Create**: `apps/api/plane/app/views/module/activity.py` -- activity list endpoint
- **Create**: `apps/api/plane/app/serializers/module.py` or add to existing serializer file -- `ModuleActivitySerializer`
- **Create**: Migration file (auto-generated via `makemigrations`)
- **Modify**: URL config files to register activity endpoint

## Embedded Rules

```
- Models: extend ProjectBaseModel, use SoftDeletionManager if needed
- Views: always scope ORM queries with project__workspace__slug=slug
- BaseViewSet/BaseAPIView inheritance for all views
- @allow_permission decorator for method-level access control
- Register new models in __init__.py
- Register new views in URL conf
- current_instance capture BEFORE update for diff tracking
```

## Implementation Steps

1. **Create `ModuleActivity` model**
   - File: `apps/api/plane/db/models/module.py`
   - Add after `ModuleUserProperties` class:

   ```python
   class ModuleActivity(ProjectBaseModel):
       module = models.ForeignKey(
           "db.Module", on_delete=models.CASCADE,
           related_name="module_activities"
       )
       actor = models.ForeignKey(
           settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
           null=True, related_name="module_activities"
       )
       verb = models.CharField(max_length=255, default="created")
       field = models.CharField(max_length=255, blank=True, null=True)
       old_value = models.TextField(blank=True, null=True)
       new_value = models.TextField(blank=True, null=True)
       epoch = models.FloatField(null=True)

       class Meta:
           verbose_name = "Module Activity"
           verbose_name_plural = "Module Activities"
           db_table = "module_activities"
           ordering = ("-created_at",)

       def __str__(self):
           return f"{self.module.name} {self.verb} {self.field}"
   ```

   - Add `from django.conf import settings` import at top if not present (already present)

2. **Export `ModuleActivity` in `__init__.py`**
   - File: `apps/api/plane/db/models/__init__.py`
   - Change line 49: add `ModuleActivity` to the module import:

   ```python
   from .module import Module, ModuleActivity, ModuleIssue, ModuleLink, ModuleMember, ModuleUserProperties
   ```

3. **Create and run migration**

   ```bash
   cd apps/api && python manage.py makemigrations db --name="add_module_activity_model"
   cd apps/api && python manage.py migrate
   ```

4. **Create helper function `log_module_activity`**
   - File: `apps/api/plane/utils/module_activity.py` (new file)

   ```python
   from django.utils import timezone
   from plane.db.models import ModuleActivity

   def log_module_activity(
       module, actor, verb, field=None, old_value=None, new_value=None,
       project_id=None, workspace_id=None
   ):
       ModuleActivity.objects.create(
           module=module,
           actor=actor,
           verb=verb,
           field=field,
           old_value=str(old_value) if old_value is not None else None,
           new_value=str(new_value) if new_value is not None else None,
           epoch=timezone.now().timestamp(),
           project_id=project_id or module.project_id,
           workspace_id=workspace_id or module.workspace_id,
           created_by=actor,
           updated_by=actor,
       )
   ```

5. **Create `ModuleActivitySerializer`**
   - Find existing module serializer file. Check `apps/api/plane/app/serializers/` for module serializers.
   - Add `ModuleActivitySerializer` to the same file or create new:

   ```python
   class ModuleActivitySerializer(BaseSerializer):
       actor_detail = UserLiteSerializer(source="actor", read_only=True)

       class Meta:
           model = ModuleActivity
           fields = "__all__"
           read_only_fields = fields
   ```

6. **Create activity list endpoint**
   - File: `apps/api/plane/app/views/module/activity.py` (new file, <100 lines)

   ```python
   from rest_framework import status
   from rest_framework.response import Response
   from plane.app.permissions import allow_permission, ROLE
   from plane.app.serializers import ModuleActivitySerializer
   from plane.db.models import ModuleActivity
   from plane.app.views.base import BaseAPIView

   class ModuleActivityEndpoint(BaseAPIView):
       @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
       def get(self, request, slug, project_id, module_id):
           activities = ModuleActivity.objects.filter(
               workspace__slug=slug,
               project_id=project_id,
               module_id=module_id,
           ).select_related("actor").order_by("-created_at")
           return self.paginate(
               request=request,
               queryset=activities,
               on_results=lambda data: ModuleActivitySerializer(data, many=True).data,
           )
   ```

7. **Register activity endpoint in URL config**
   - Find module URL patterns. Likely in `apps/api/plane/app/urls/` or similar.
   - Add URL pattern:

   ```python
   path(
       "workspaces/<str:slug>/projects/<uuid:project_id>/modules/<uuid:module_id>/activities/",
       ModuleActivityEndpoint.as_view(),
       name="module-activities",
   ),
   ```

   - Also register in the view `__init__.py` for the module views directory.

8. **Log activity in app view `create` (base.py)**
   - After `serializer.save()` in `create` method, add:

   ```python
   log_module_activity(
       module=serializer.instance, actor=request.user,
       verb="created", field=None,
   )
   ```

9. **Log activity in app view `partial_update` (base.py)**
   - Before update, capture current values for changed fields.
   - After `serializer.save()`, for each changed field log:

   ```python
   for field_name in request.data:
       if field_name in ["name", "description", "status", "start_date", "target_date", "lead_id", "member_ids"]:
           old_val = current_instance_data.get(field_name)
           new_val = request.data.get(field_name)
           if str(old_val) != str(new_val):
               log_module_activity(
                   module=module, actor=request.user,
                   verb="updated", field=field_name,
                   old_value=old_val, new_value=new_val,
               )
   ```

10. **Log activity in app view `destroy` (base.py)**
    - Before `module.delete()`:

    ```python
    log_module_activity(
        module=module, actor=request.user,
        verb="deleted", field=None,
        old_value=module.name,
    )
    ```

11. **Log activity in archive/unarchive (archive.py)**
    - Archive (`post`): `log_module_activity(module=module, actor=request.user, verb="archived")`
    - Unarchive (`delete`): `log_module_activity(module=module, actor=request.user, verb="unarchived")`

12. **Log activity in module issue views (issue.py)**
    - `create_module_issues`: log `verb="updated", field="work_items", new_value=<issue_ids_added>`
    - `destroy`: log `verb="updated", field="work_items", old_value=<issue_id_removed>`

13. ~~**Log activity in API views (module.py)**~~ — **REMOVED (Validation Session 1)**: Activity logging scoped to App views only. API v1 views excluded to reduce scope.
<!-- Updated: Validation Session 1 - Removed API view activity logging per validation decision -->

## Post-Phase Checklist

- [x] `ModuleActivity` model created with correct fields and Meta
- [x] Migration generated and applied
- [x] `ModuleActivity` exported in `__init__.py`
- [x] `log_module_activity` helper function created
- [x] Activity logged for: create, update (per-field), delete, archive, unarchive, work item add/remove
- [x] GET activity endpoint returns paginated, ordered results
- [x] Serializer includes actor details
- [x] URL pattern registered
- [x] `cd apps/api && python run_tests.py -u` passes

## Todo List

- [x] Create `ModuleActivity` model
- [x] Export in `__init__.py`
- [x] Create and run migration
- [x] Create `log_module_activity` helper
- [x] Create `ModuleActivitySerializer`
- [x] Create `ModuleActivityEndpoint`
- [x] Register URL
- [x] Add activity logging to app view create
- [x] Add activity logging to app view partial_update
- [x] Add activity logging to app view destroy
- [x] Add activity logging to archive/unarchive
- [x] Add activity logging to module issue create/destroy
- [x] ~~Add activity logging to API views~~ (removed per Validation Session 1)
- [x] Run tests
- [x] Mark phase complete

## Success Criteria

- `GET /modules/:id/activities/` returns chronological list of all module changes
- Each activity has: actor, verb, field, old_value, new_value, timestamps
- Creating/updating/deleting modules generates corresponding activity records
- Adding/removing work items generates activity records

## Risk Assessment

- **Low**: Simple model + synchronous writes. No complex async patterns.
- **Medium**: Many view methods to instrument -- risk of missing some. Mitigate with comprehensive todo list.
- **Low**: Performance impact of synchronous INSERT per mutation is negligible.

## Security Considerations

- Activity endpoint is read-only, accessible to all project members
- Actor FK uses SET_NULL to preserve activity even if user is deleted
- No sensitive data stored in old_value/new_value (just names, IDs, statuses)

## Next Steps

- Phase 4 (frontend activity sidebar) depends on this completing
- Frontend will consume the activity API and render in the sidebar
