# Phase 3 — Backend Activity Tracking

**Priority**: High
**Status**: [x] Complete
**Risk**: Low — additive changes, fire-and-forget Celery tasks
**Estimated effort**: ~1 hour

## Context

- Rule: `plane-backend-architecture.md` → After create/update/delete, always fire `model_activity.delay()` for webhook events
- Currently: Department, Staff, and Analytics Dashboard views have NO activity tracking
- Pattern reference: `plane/app/views/issue/base.py` (IssueViewSet.create)

## Key Insights

- `model_activity.delay()` is from `plane/bgtasks/webhook_task.py`
- Required params: `model_name`, `model_id`, `requested_data`, `current_instance`, `actor_id`, `slug`, `origin`
- For updates: capture `current_instance = json.dumps(Serializer(obj).data, cls=DjangoJSONEncoder)` BEFORE saving
- Import: `from plane.bgtasks.webhook_task import model_activity`
- Import: `from django.core.serializers.json import DjangoJSONEncoder`
- Import: `from plane.utils.host import base_host`

## Related Code Files

### Department Views

#### [MODIFY] department.py

`apps/api/plane/app/views/workspace/department.py` (265 lines)

**DepartmentViewSet** — add activity tracking to:

- `create()` method: fire after `serializer.save()`
- `partial_update()` method: capture `current_instance` before save, fire after
- `destroy()` method: fire before soft delete

**DepartmentLinkProjectEndpoint** — add activity tracking to:

- `post()` method (link project)
- `delete()` method (unlink project)

```python
# After create:
model_activity.delay(
    model_name="department",
    model_id=str(serializer.data["id"]),
    requested_data=request.data,
    current_instance=None,
    actor_id=request.user.id,
    slug=slug,
    origin=base_host(request=request, is_app=True),
)

# Before update — capture current state:
current_instance = json.dumps(
    DepartmentSerializer(department).data,
    cls=DjangoJSONEncoder,
)

# After update:
model_activity.delay(
    model_name="department",
    model_id=str(department.id),
    requested_data=request.data,
    current_instance=current_instance,
    actor_id=request.user.id,
    slug=slug,
    origin=base_host(request=request, is_app=True),
)

# After delete:
model_activity.delay(
    model_name="department",
    model_id=str(pk),
    requested_data=None,
    current_instance=current_instance,
    actor_id=request.user.id,
    slug=slug,
    origin=base_host(request=request, is_app=True),
)
```

---

### Staff Views

#### [MODIFY] staff.py

`apps/api/plane/app/views/workspace/staff.py` (637 lines)

**StaffProfileViewSet** — add activity tracking to:

- `create()` method
- `partial_update()` method (capture before state)
- `destroy()` method

**StaffBulkImportEndpoint** — add activity tracking:

- `post()` method — single event for bulk import with count in requested_data

**StaffAutoMembershipEndpoint** — add activity tracking:

- `post()` method — track auto-membership trigger

---

### Analytics Dashboard Views

#### [MODIFY] analytics_dashboard.py

`apps/api/plane/app/views/analytics_dashboard.py` (507 lines)

**AnalyticsDashboardViewSet** — add activity tracking to:

- `create()` method
- `partial_update()` method (capture before state)
- `destroy()` method

**AnalyticsDashboardWidgetViewSet** — add activity tracking to:

- `create()` method
- `partial_update()` method
- `destroy()` method

---

## Implementation Steps

1. Add imports to all 3 view files:
   ```python
   import json
   from django.core.serializers.json import DjangoJSONEncoder
   from plane.bgtasks.webhook_task import model_activity
   from plane.utils.host import base_host
   ```
2. For each `create` method: add `model_activity.delay()` after successful save
3. For each `partial_update` method: capture `current_instance` BEFORE save, then fire after
4. For each `destroy` method: capture `current_instance` BEFORE delete, then fire after
5. Run tests: `cd apps/api && python run_tests.py`

## Todo List

- [x]Department: add imports
- [x]Department: DepartmentViewSet.create
- [x]Department: DepartmentViewSet.partial_update (+ current_instance capture)
- [x]Department: DepartmentViewSet.destroy (+ current_instance capture)
- [x]Department: DepartmentLinkProjectEndpoint.post
- [x]Department: DepartmentLinkProjectEndpoint.delete
- [x]Staff: add imports
- [x]Staff: StaffProfileViewSet.create
- [x]Staff: StaffProfileViewSet.partial_update
- [x]Staff: StaffProfileViewSet.destroy
- [x]Staff: StaffBulkImportEndpoint.post
- [x]Staff: StaffAutoMembershipEndpoint.post
- [x]Dashboard: add imports
- [x]Dashboard: AnalyticsDashboardViewSet.create
- [x]Dashboard: AnalyticsDashboardViewSet.partial_update
- [x]Dashboard: AnalyticsDashboardViewSet.destroy
- [x]Dashboard: AnalyticsDashboardWidgetViewSet.create
- [x]Dashboard: AnalyticsDashboardWidgetViewSet.partial_update
- [x]Dashboard: AnalyticsDashboardWidgetViewSet.destroy
- [x]Run tests

## Risk Assessment

- **Low risk**: `model_activity.delay()` is fire-and-forget Celery task — if it fails, main request still succeeds
- **No migration needed**: no model changes
- **Webhook consumers**: if no webhook configured, task is a no-op
