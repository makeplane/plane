# Phase 1: Database & API (Backend)

## Context Links
- Model base: `apps/api/plane/db/models/base.py` (BaseModel with UUID pk, AuditModel)
- ProjectBaseModel: `apps/api/plane/db/models/project.py:178` (auto-sets workspace from project)
- Issue model: `apps/api/plane/db/models/issue.py` (has `estimate_point` FK, no time estimate)
- Existing view pattern: `apps/api/plane/app/views/issue/comment.py` (IssueCommentViewSet)
- Serializer pattern: `apps/api/plane/app/serializers/issue.py`
- URL pattern: `apps/api/plane/app/urls/issue.py`
- Permissions: `apps/api/plane/app/permissions/` (allow_permission, ROLE)

## Overview
- **Priority**: P1
- **Status**: complete
- Create IssueWorkLog model, add estimate_time to Issue, build CRUD API + summary endpoints.

## Key Insights
<!-- Updated: Validation Session 2 - v0 API layer, enabled by default -->
- `ProjectBaseModel` auto-sets workspace from project FK — use it for IssueWorkLog
- `is_time_tracking_enabled` already exists on Project — gate API access behind it; **change default to True**
- **Use v0 API layer** (`plane/app/`) following IssueComment pattern exactly
- `IssueCommentViewSet` is closest pattern: nested under issue, uses `allow_permission`
- Store duration as integer minutes (simple, avoids float precision issues)
- `issue_worklogs` already in exporter choices — model name must match
- Add migration to set `is_time_tracking_enabled` default=True

## Requirements
### Functional
- CRUD for worklog entries scoped to workspace/project/issue
- Members can edit/delete only own entries; admins can edit/delete any
- Time estimate field on issues (nullable integer minutes)
- Summary endpoint aggregating total logged time per issue, per member
- Workspace-level summary endpoint for cross-project reporting

### Non-functional
- DB indexes on (issue_id, logged_by_id) and (project_id, logged_at)
- Pagination on list endpoints
- Gate behind `is_time_tracking_enabled` project setting

## Architecture
### IssueWorkLog Model
```python
class IssueWorkLog(ProjectBaseModel):
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="issue_worklogs")
    logged_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="worklogs")
    duration_minutes = models.PositiveIntegerField()  # time in minutes
    description = models.TextField(blank=True, default="")
    logged_at = models.DateField()  # the date work was performed

    class Meta:
        db_table = "issue_worklogs"
        ordering = ("-logged_at", "-created_at")
        indexes = [
            models.Index(fields=["issue", "logged_by"]),
            models.Index(fields=["project", "logged_at"]),
        ]
```

### Issue Model Addition
```python
estimate_time = models.PositiveIntegerField(null=True, blank=True)  # minutes
```

### API Endpoints
<!-- Updated: Validation Session 2 - Use v0 API layer (plane/app/), not v1 -->
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/workspaces/{slug}/projects/{pid}/issues/{iid}/worklogs/` | List/Create |
| GET/PUT/DELETE | `/api/workspaces/{slug}/projects/{pid}/issues/{iid}/worklogs/{id}/` | Detail |
| GET | `/api/workspaces/{slug}/projects/{pid}/worklogs/summary/` | Project summary |
| GET | `/api/workspaces/{slug}/time-tracking/summary/` | Workspace summary |

## Related Code Files
### Create
- `apps/api/plane/db/models/worklog.py` — IssueWorkLog model
- `apps/api/plane/app/serializers/worklog.py` — serializers
- `apps/api/plane/app/views/issue/worklog.py` — viewset
- `apps/api/plane/app/views/workspace/time_tracking.py` — workspace summary
- `apps/api/plane/app/urls/worklog.py` — URL config
- Migration file for IssueWorkLog + estimate_time on Issue

### Modify
- `apps/api/plane/db/models/__init__.py` — add IssueWorkLog import
- `apps/api/plane/db/models/issue.py` — add estimate_time field
- `apps/api/plane/app/serializers/__init__.py` — add serializer imports
- `apps/api/plane/app/serializers/issue.py` — add estimate_time to Issue serializer fields
- `apps/api/plane/app/views/__init__.py` — add view imports
- `apps/api/plane/app/urls/__init__.py` — include worklog URLs

## Implementation Steps

1. **Create IssueWorkLog model** in `apps/api/plane/db/models/worklog.py`
   - Extend `ProjectBaseModel`
   - Fields: issue (FK), logged_by (FK), duration_minutes (PositiveIntegerField), description (TextField), logged_at (DateField)
   - Meta: db_table="issue_worklogs", ordering, indexes

2. **Add estimate_time to Issue model**
   - `apps/api/plane/db/models/issue.py`: add `estimate_time = models.PositiveIntegerField(null=True, blank=True)`
   - After `type` field (line ~168)

3. **Register in __init__.py**
   - `apps/api/plane/db/models/__init__.py`: `from .worklog import IssueWorkLog`

4. **Create migration**
   - `python manage.py makemigrations db`

5. **Create serializers** in `apps/api/plane/app/serializers/worklog.py`
   - `IssueWorkLogSerializer`: fields = [id, issue, logged_by, duration_minutes, description, logged_at, created_at, updated_at]
   - Read-only: id, created_at, updated_at
   - `logged_by` auto-set from request.user in viewset

6. **Add estimate_time to Issue serializer**
   - Find IssueSerializer/IssueCreateSerializer fields list, add `estimate_time`

7. **Create viewset** in `apps/api/plane/app/views/issue/worklog.py`
   - `IssueWorkLogViewSet(BaseViewSet)`:
     - `get_queryset()`: filter by workspace slug, project_id, issue_id + active project member check
     - `create()`: set logged_by=request.user, validate is_time_tracking_enabled
     - `update()/destroy()`: own entries for members, any for admins
     - Permission: `allow_permission([ROLE.ADMIN, ROLE.MEMBER])`

8. **Create project summary endpoint** in same file or separate
   - Aggregate worklogs by issue and member using Django ORM Sum/Count
   - Return: per-issue totals, per-member totals, grand total
   - Filter by date_range query params

9. **Create workspace summary endpoint** in `apps/api/plane/app/views/workspace/time_tracking.py`
   - Aggregate across projects
   - Filter by project_id, member_id, date_range

10. **Create URL config** in `apps/api/plane/app/urls/worklog.py`
    - Wire ViewSet with router or path() patterns matching existing patterns

11. **Register URLs** in `apps/api/plane/app/urls/__init__.py`

12. **Issue activity integration** — fire `issue_activity` task on worklog create/update/delete with `WORKLOG` type

## Todo List
- [ ] Create IssueWorkLog model
- [ ] Add estimate_time to Issue model
- [ ] Register model in __init__.py
- [ ] Create and run migration
- [ ] Create worklog serializers
- [ ] Add estimate_time to Issue serializer
- [ ] Create IssueWorkLogViewSet
- [ ] Create project summary endpoint
- [ ] Create workspace summary endpoint
- [ ] Create URL configuration
- [ ] Wire activity tracking for worklogs
- [ ] Test API endpoints manually

## Success Criteria
- Migration runs cleanly
- CRUD operations work via API
- Summary endpoints return correct aggregations
- Only members of project can access; gated by is_time_tracking_enabled
- Own-entry restriction enforced for non-admins

## Risk Assessment
- **Migration conflicts**: Other branches may add Issue fields simultaneously → coordinate merge
- **Performance**: Summary queries on large datasets → add DB indexes, use `.only()` selectively

## Security Considerations
- Permission check: project membership required
- Owner check: non-admins can only modify own worklogs
- Feature gate: check `is_time_tracking_enabled` before allowing operations
- Input validation: duration_minutes > 0, logged_at not in far future

## Next Steps
- Phase 2: TypeScript types matching these API responses
