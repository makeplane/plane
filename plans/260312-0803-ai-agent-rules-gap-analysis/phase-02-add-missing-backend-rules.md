# Phase 2: Add Missing Backend Rules (P2)

## Context Links

- [Plan Overview](plan.md)
- [Phase 1 — Critical Fixes](phase-01-fix-critical-rule-contradictions.md)
- [Plane Patterns Research](research/researcher-01-plane-patterns.md)
- [Backend Views Rule](../../.claude/rules/backend-views.md)
- [Backend URLs & Celery Rule](../../.claude/rules/backend-urls-celery.md)
- [Backend Architecture Rule](../../.claude/rules/plane-backend-architecture.md)

## Overview

- **Priority**: P2
- **Status**: complete
- **Effort**: 45m
- **Description**: Add 3 missing backend patterns to existing rule files: Instance Admin permission pattern (GAP 4), API v0 vs v1 decision guidance (GAP 8), and Celery task registration (GAP 7).

## Key Insights

- God Mode/admin endpoints use `BaseAPIView` + `InstanceAdminPermission`, NOT `BaseViewSet` + `@allow_permission`
- These are under `plane/license/api/views/` with separate URL registration
- `InstanceAdminPermission` checks `role >= 15` on Instance model
- API v0 (`plane/app/`) = internal session-auth endpoints; v1 (`plane/api/`) = external API-key endpoints
- Celery tasks registered in `plane/celery.py` via `CELERY_IMPORTS` list
- 36+ existing tasks in `plane/bgtasks/`

## Requirements

- **Functional**: Backend rules must cover Instance Admin context so AI doesn't apply workspace patterns to God Mode views
- **Non-functional**: Rules should be concise additions to existing files (KISS), not new rule files

## Architecture

### GAP 4: Instance Admin Permission Pattern

Two distinct backend contexts exist:

| Context           | Base Class    | Permission                | URL Prefix            | Example                     |
| ----------------- | ------------- | ------------------------- | --------------------- | --------------------------- |
| Workspace/Project | `BaseViewSet` | `@allow_permission`       | `/api/v0/workspaces/` | IssueViewSet                |
| Instance/God Mode | `BaseAPIView` | `InstanceAdminPermission` | `/api/instances/`     | Instance config, monitoring |

### GAP 7: Celery Task Registration

New tasks must be:

1. Created in `plane/bgtasks/`
2. Registered in `plane/celery.py` `CELERY_IMPORTS`
3. Called with `str(obj.id)` (never model instances)

### GAP 8: API v0 vs v1 Decision

| Question      | v0 (`plane/app/`)         | v1 (`plane/api/`)               |
| ------------- | ------------------------- | ------------------------------- |
| Who calls it? | Frontend (session cookie) | External integrations (API key) |
| Auth          | Session                   | API Key / OAuth                 |
| OpenAPI       | No `@extend_schema`       | Requires `@extend_schema`       |
| Serializers   | Own set                   | Own SEPARATE set                |

## Related Code Files

- **Modify**: `.claude/rules/backend-views.md` — add Instance Admin section
- **Modify**: `.claude/rules/backend-urls-celery.md` — add Celery registration steps
- **Modify**: `.claude/rules/plane-backend-architecture.md` — add v0/v1 decision guidance

## Embedded Rules

1. **Rule accuracy**: Every rule statement MUST be verified against actual codebase grep results before writing
2. **Negative examples**: Every correction MUST include ❌ WRONG and ✅ CORRECT examples
3. **Path scoping**: Every rule file MUST have correct `paths:` frontmatter matching actual directories
4. **No contradictions**: After editing, grep for the old incorrect pattern across ALL rule files to ensure no contradictions remain

## Implementation Steps

### Step 1: Add Instance Admin Section to `backend-views.md`

Add new section after "Permission Patterns" (before "Guest Access Pattern"):

````markdown
## Instance Admin Views (God Mode / License Context)

For admin-panel/God Mode endpoints (instance configuration, monitoring, user management):

```python
from plane.license.api.views import BaseAPIView
from plane.license.api.permissions import InstanceAdminPermission

class MyInstanceView(BaseAPIView):
    permission_classes = [InstanceAdminPermission]

    def get(self, request):
        # Instance-level data, NOT workspace-scoped
        return Response(data)
```
````

**Key differences from workspace views:**

- Inherit `BaseAPIView` from `plane.license.api.views` (NOT `plane.app.views`)
- Use `InstanceAdminPermission` (NOT `@allow_permission`)
- No `workspace_slug` or `project_id` in kwargs
- URLs under `plane/license/api/urls/`
- No activity tracking (`issue_activity.delay()` not applicable)

❌ WRONG — Using workspace patterns for God Mode:

```python
class MonitoringViewSet(BaseViewSet):  # Wrong base
    @allow_permission([ROLE.ADMIN])     # Wrong permission
```

✅ CORRECT — Instance admin pattern:

```python
class MonitoringView(BaseAPIView):
    permission_classes = [InstanceAdminPermission]
```

````

### Step 2: Add Celery Registration to `backend-urls-celery.md`

Add section after "Background Tasks (Celery)":

```markdown
### Task Registration — CRITICAL

New tasks MUST be registered in `plane/celery.py`:

```python
# plane/celery.py
CELERY_IMPORTS = (
    "plane.bgtasks.existing_task",
    "plane.bgtasks.my_new_task",  # ADD HERE
)
````

If you skip this, the task will import but Celery workers won't discover it.

### Task Error Handling

```python
@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def my_task(self, model_id):
    try:
        obj = MyModel.objects.get(id=model_id)
        # process...
    except MyModel.DoesNotExist:
        return  # Object deleted, skip silently
    except Exception as e:
        log_exception(e)
        self.retry(exc=e)  # Retry with backoff
```

````

### Step 3: Add v0/v1 Decision to `plane-backend-architecture.md`

Expand the "Two API Layers" section with decision guidance:

```markdown
### When to Use Which API Layer

**Use `plane/app/` (v0)** when:
- Endpoint is called by Plane's own frontend (apps/web, apps/admin)
- Uses session authentication (cookie-based)
- No need for public API documentation

**Use `plane/api/` (v1)** when:
- Endpoint is for external integrations, third-party tools
- Needs API key or OAuth authentication
- Must appear in OpenAPI/Swagger docs (`@extend_schema` required)
- Needs separate serializers (different fields exposed externally)

**Use `plane/license/api/` (instance admin)** when:
- Endpoint is for God Mode / instance-level admin panel
- Uses `InstanceAdminPermission`
- No workspace/project scoping

❌ WRONG — Adding frontend-only endpoint to v1:
```python
# plane/api/views/my_view.py  ← Wrong layer
class DashboardView(BaseAPIView):  # Frontend calls this
````

✅ CORRECT — Frontend endpoint in v0:

```python
# plane/app/views/my_view.py  ← Correct layer
class DashboardViewSet(BaseViewSet):
```

````

### Step 4: Verify Path Scoping

Ensure `backend-views.md` paths include license views:
```yaml
paths:
  - plane/app/views/**
  - plane/api/views/**
  - plane/license/api/views/**  # ADD if missing
````

### Step 5: Verification

```bash
# Verify InstanceAdminPermission exists and is used:
grep -r "InstanceAdminPermission" apps/api/plane/license/ --include="*.py" -l

# Verify CELERY_IMPORTS exists:
grep -r "CELERY_IMPORTS" apps/api/plane/celery.py

# Verify no contradictions introduced:
grep -r "BaseViewSet.*God Mode\|God Mode.*BaseViewSet" .claude/rules/ --include="*.md"
```

## Post-Phase Checklist

- [ ] `backend-views.md` has Instance Admin section with ❌/✅ examples
- [ ] `backend-urls-celery.md` has Celery registration steps with `CELERY_IMPORTS` example
- [ ] `plane-backend-architecture.md` has v0/v1/license decision guidance
- [ ] All examples verified against actual codebase imports/patterns
- [ ] No contradictions between new and existing rule sections

## Todo List

- [ ] Add Instance Admin Views section to `backend-views.md`
- [ ] Update `backend-views.md` paths frontmatter to include license views
- [ ] Add Celery registration section to `backend-urls-celery.md`
- [ ] Add v0/v1 decision guidance to `plane-backend-architecture.md`
- [ ] Run grep verification
- [ ] Mark phase complete in plan.md

## Success Criteria

- AI agents use `BaseAPIView` + `InstanceAdminPermission` for God Mode views (not `BaseViewSet`)
- AI agents register new Celery tasks in `CELERY_IMPORTS`
- AI agents choose correct API layer (v0/v1/license) based on endpoint purpose

## Risk Assessment

- **Risk**: Instance admin patterns may vary across license views
  - **Mitigation**: Grep actual usage patterns before writing rule; show most common pattern
- **Risk**: Adding too much detail bloats rule files beyond useful context
  - **Mitigation**: Keep additions concise — one section per gap, with one ❌/✅ example pair each

## Security Considerations

- Instance admin views are security-critical — `InstanceAdminPermission` must always be documented as required (never optional)
- Rule must emphasize: no `@allow_permission` for instance endpoints (different auth model)

## Next Steps

- Phase 3 (frontend rules) can run in parallel with this phase
- Phase 4 (anti-hallucination) depends on both Phase 2 and Phase 3
