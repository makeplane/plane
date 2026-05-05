# Phase 2: Backend — API Endpoints for Export

## Context

- [ExportIssuesEndpoint](../../apps/api/plane/app/views/exporter/base.py) — pattern to follow
- [ProjectWorkLogViewSet](../../apps/api/plane/app/views/project/worklog.py) — extend this
- [project urls](../../apps/api/plane/app/urls/project.py) — add routes here
- [ExporterHistorySerializer](../../apps/api/plane/app/serializers/exporter.py) — reuse

## Overview

- **Priority:** P2
- **Status:** done
- Add two endpoints: POST to trigger export, GET to list export history for project worklogs.

## Key Insights

- Follow `ExportIssuesEndpoint` pattern exactly — POST creates ExporterHistory + triggers Celery task
- GET uses `self.paginate()` from BaseAPIView with cursor pagination
- Filter export history by `type="issue_worklogs"` and project array containing current project_id

## Requirements

### Functional

- `POST .../worklogs/export/` — trigger async export with provider (csv/xlsx) + current filters
- `GET .../worklogs/export/` — list export history for this project, paginated
- Both require ADMIN or MEMBER role

### Non-functional

- Response time <200ms for both endpoints (export is async)

## Architecture

### Endpoints

```
POST /api/workspaces/<slug>/projects/<project_id>/worklogs/export/
  Body: { provider: "csv"|"xlsx", filters: { member_id?, date_from?, date_to? } }
  Response: 200 { message: "...", export_id: "..." }

GET /api/workspaces/<slug>/projects/<project_id>/worklogs/export/
  Params: per_page, cursor
  Response: paginated ExporterHistory list (type="issue_worklogs", project contains project_id)
```

## Related Code Files

### Modify

- `apps/api/plane/app/views/project/worklog.py` — add `export` and `export_history` actions
- `apps/api/plane/app/urls/project.py` — add export URL route

### No Changes

- `apps/api/plane/app/serializers/exporter.py` — reuse ExporterHistorySerializer as-is

## Implementation Steps

1. **Add export endpoint to `ProjectWorkLogViewSet`** (or create separate view):

   Option A (preferred): Add as separate `ProjectWorklogExportView(BaseAPIView)` for clean separation.

   ```python
   <!-- Updated: Validation Session 1 - URL changed to nested project pattern -->
   class ProjectWorklogExportView(BaseAPIView):
       @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
       def post(self, request, slug, project_id):
        workspace = Workspace.objects.get(slug=slug)
           provider = request.data.get("provider", "csv")
           filters = request.data.get("filters", {})

           if provider not in ["csv", "xlsx"]:
               return Response({"error": "Invalid provider"}, status=400)

           exporter = ExporterHistory.objects.create(
               workspace=workspace,
               project=[str(project_id)],
               initiated_by=request.user,
               provider=provider,
               type="issue_worklogs",
               filters=filters,
           )

           worklog_export_task.delay(
               provider=provider,
               workspace_id=workspace.id,
               project_id=str(project_id),
               token_id=exporter.token,
               slug=slug,
               filters=filters,
           )

           return Response({
               "message": "Export started",
               "export_id": str(exporter.id),
           }, status=200)

       @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
       def get(self, request, slug, project_id):
           history = ExporterHistory.objects.filter(
               workspace__slug=slug,
               type="issue_worklogs",
               project__contains=[str(project_id)],
           ).select_related("workspace", "initiated_by")

           return self.paginate(
               order_by="-created_at",
               request=request,
               queryset=history,
               on_results=lambda h: ExporterHistorySerializer(h, many=True).data,
           )
   ```

2. **Add URL route** in `apps/api/plane/app/urls/project.py`:

   ```python
   <!-- Updated: Validation Session 1 - nested under project -->
   path(
       "workspaces/<str:slug>/projects/<uuid:project_id>/worklogs/export/",
       ProjectWorklogExportView.as_view(),
       name="project-worklog-export",
   ),
   ```

3. **Import the new view** in urls and views `__init__.py`

## Todo

- [ ] Create `ProjectWorklogExportView` in `apps/api/plane/app/views/project/worklog.py`
- [ ] Add URL route in `apps/api/plane/app/urls/project.py`
- [ ] Update view imports in `__init__.py`
- [ ] Test POST endpoint triggers Celery task
- [ ] Test GET endpoint returns paginated history

## Success Criteria

- POST creates ExporterHistory and returns 200
- GET returns paginated list filtered by project + type
- Invalid provider returns 400
- Permissions enforced (ADMIN/MEMBER only)

## Risk Assessment

- **ArrayField `__contains` query**: PostgreSQL `@>` operator — works for UUID arrays, verify with test
- **Race condition**: Multiple exports for same project — acceptable, each gets unique token

## Security

- Permission check: ADMIN or MEMBER of workspace
- Project membership verified implicitly via ExporterHistory.project filter
- Filters are stored in ExporterHistory for audit trail

## Next Steps

- Frontend phases 3-5 consume these endpoints
