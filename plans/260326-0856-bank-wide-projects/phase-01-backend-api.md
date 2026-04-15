# Phase 1 — Backend API Endpoint

**Plan**: [plan.md](./plan.md)
**Status**: completed | **Effort**: 1.5h

## Context

New endpoint that returns all `is_bank_wide=True` projects from ALL workspaces. Only accessible by users in a Board of Director workspace.

## Key Insights

- `is_bank_wide` field + migration already exist — no new migration needed
- `ProjectListSerializer` uses `fields = "__all__"` → `is_bank_wide` already in responses
- All existing project views are workspace-scoped; need one that cross-queries
- Permission guard: calling workspace must have `is_board_of_director_workspace=True`

## Architecture

```
GET /api/workspaces/{slug}/bank-wide-projects/
  → WorkspaceBankWideProjectsEndpoint
  → Permission: WORKSPACE level (ADMIN|MEMBER) + is_board_of_director_workspace check
  → Query: Project.objects.filter(is_bank_wide=True)
  → Serializer: ProjectListSerializer (already includes is_bank_wide, workspace info)
```

### Response shape (per project)

Must include workspace info so the frontend can show which workspace each project belongs to. Use `ProjectListSerializer` + annotate workspace slug/name.

## Related Code Files

- `apps/api/plane/db/models/project.py` — Project model
- `apps/api/plane/app/views/project/base.py` — Existing ProjectViewSet (reference)
- `apps/api/plane/app/serializers/project.py` — ProjectListSerializer
- `apps/api/plane/app/permissions/base.py` — Permission patterns
- `apps/api/plane/app/urls/project.py` — URL registration

## Implementation Steps

### 1. Create view: `apps/api/plane/app/views/project/bank_wide.py`

```python
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import Project, Workspace
from plane.app.serializers import ProjectListSerializer
from rest_framework.response import Response
from rest_framework import status

class WorkspaceBankWideProjectsEndpoint(BaseAPIView):

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        # Guard: only Board of Director workspaces can access
        workspace = Workspace.objects.filter(slug=slug).first()
        if not workspace or not workspace.is_board_of_director_workspace:
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

        # Cross-workspace query — all bank-wide projects
        projects = (
            Project.objects.filter(is_bank_wide=True)
            .select_related("workspace")
            .order_by("workspace__name", "name")
        )

        serializer = ProjectListSerializer(
            projects,
            many=True,
            fields=["id", "name", "identifier", "description", "logo_props",
                    "cover_image", "cover_image_url", "network", "is_bank_wide",
                    "workspace", "workspace__slug", "workspace__name"]
        )
        return Response(serializer.data, status=status.HTTP_200_OK)
```

> **Note:** Verify `workspace__slug` / `workspace__name` work with `DynamicBaseSerializer`. If not, use `.values()` or a custom serializer with `workspace_slug = serializers.SerializerMethodField()`.

### 2. Register URL: `apps/api/plane/app/urls/project.py`

```python
path(
    "workspaces/<str:slug>/bank-wide-projects/",
    WorkspaceBankWideProjectsEndpoint.as_view(),
    name="workspace-bank-wide-projects",
),
```

### 3. Export view in `apps/api/plane/app/views/__init__.py` or views/project/**init**.py

Add import for `WorkspaceBankWideProjectsEndpoint`.

## Todo

- [ ] Create `apps/api/plane/app/views/project/bank_wide.py`
- [ ] Register URL in `apps/api/plane/app/urls/project.py`
- [ ] Export new view in views `__init__.py`
- [ ] Test endpoint with curl: `GET /api/workspaces/{bod-slug}/bank-wide-projects/`
- [ ] Verify 403 returned for non-BoD workspaces

## Success Criteria

- `GET /api/workspaces/{bod-slug}/bank-wide-projects/` returns list of `is_bank_wide=True` projects
- Response includes `workspace` slug/name for each project
- Returns 403 if calling workspace is not a Board of Director workspace
- No N+1 queries (use `select_related`)

## Risk Assessment

- **Serializer field access**: `DynamicBaseSerializer` may not support cross-FK `workspace__slug` — test and adjust
- **Permission logic**: `is_board_of_director_workspace` must be checked on the Workspace model, not inline

## Security Considerations

- Must validate `is_board_of_director_workspace` server-side, not trust frontend
- Cross-workspace data: ensure no sensitive data leaks (project description may contain confidential info — acceptable as BoD users have admin visibility)
