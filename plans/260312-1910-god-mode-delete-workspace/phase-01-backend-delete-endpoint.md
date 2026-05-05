# Phase 01 — Backend: Delete Endpoint

**Parent plan:** [plan.md](./plan.md)
**Status:** ✅ complete

## Overview

Add `DELETE /api/instances/workspaces/<slug>/` endpoint to allow god-mode admins to delete any workspace.

## Key Insights

- `InstanceWorkSpaceEndpoint` handles list + create at `/api/instances/workspaces/`
- No individual workspace route exists yet in `plane/license/urls.py`
- Permission class `InstanceAdminPermission` already restricts to instance admins
- Regular workspace delete uses `WorkSpaceViewSet.destroy()` at `/api/workspaces/<slug>/` — we mirror this logic

## Architecture

```
GET/POST  /api/instances/workspaces/         → InstanceWorkSpaceEndpoint (existing)
DELETE    /api/instances/workspaces/<slug>/  → InstanceWorkSpaceDetailEndpoint (new)
```

## Related Code Files

- `apps/api/plane/license/api/views/workspace.py` (lines 35–111) — existing endpoint
- `apps/api/plane/license/urls.py` (line 80) — route registration
- `apps/api/plane/app/views/workspace/base.py` — reference `destroy()` logic

## Implementation Steps

1. **`apps/api/plane/license/api/views/workspace.py`** — add new class:

   ```python
   class InstanceWorkSpaceDetailEndpoint(BaseAPIView):
       permission_classes = [InstanceAdminPermission]

       def delete(self, request, slug):
           workspace = Workspace.objects.get(slug=slug)
           workspace.delete()
           return Response(status=status.HTTP_204_NO_CONTENT)
   ```

2. **`apps/api/plane/license/api/views/__init__.py`** — export new class

3. **`apps/api/plane/license/urls.py`** — add route:
   ```python
   path("workspaces/<str:slug>/", InstanceWorkSpaceDetailEndpoint.as_view(), name="instance-workspace-detail"),
   ```

## Todo

- [x] Add `InstanceWorkSpaceDetailEndpoint` with `delete` method
- [x] Export from `__init__.py`
- [x] Register route `workspaces/<str:slug>/`

## Success Criteria

- `DELETE /api/instances/workspaces/{slug}/` returns `204` for instance admin
- Workspace is removed from DB
- Non-admin requests return `403`

## Risk Assessment

- **Low**: Destructive operation — ensured by `InstanceAdminPermission`
- **Medium**: Cascading deletes (projects, issues, members) handled by Django model `on_delete=CASCADE`
