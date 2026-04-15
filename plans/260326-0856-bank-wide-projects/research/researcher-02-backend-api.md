# Research: Backend Project Model & API

## Key Findings

### is_bank_wide Already Exists

- Model field: `apps/api/plane/db/models/project.py` line 101
  - `is_bank_wide = models.BooleanField(default=False, verbose_name="Is Bank-wide Project")`
- Migration: `apps/api/plane/db/migrations/0143_project_is_bank_wide.py` — **already applied**
- Serializers use `fields = "__all__"` → field already exposed in API responses

### Project Serializers

- Full: `apps/api/plane/app/serializers/project.py` — `ProjectSerializer` & `ProjectListSerializer`
- `ProjectListSerializer` uses `DynamicBaseSerializer`, adds is_favorite, sort_order, member_role

### Existing Views (workspace-scoped)

- `apps/api/plane/app/views/project/base.py` — `ProjectViewSet`
  - All queries filtered by `workspace__slug`
- `apps/api/plane/api/views/project.py` — `ProjectListCreateAPIEndpoint`

### Cross-Workspace Pattern (needed)

Currently NO cross-workspace endpoints. New endpoint needed:

```python
Project.objects.filter(is_bank_wide=True)  # No workspace filter
```

Access control considerations:

- Who can see bank-wide projects list? Only Board of Director workspace users?
- Should require `is_board_of_director_workspace` check on the calling workspace

### API URL Convention

- Current: `/api/workspaces/{slug}/projects/`
- New endpoint: `/api/workspaces/{slug}/bank-wide-projects/` (scoped to requesting workspace but returns cross-workspace data)

### Permissions Pattern

- `@allow_permission([ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")`
- Additional guard: check requesting workspace's `is_board_of_director_workspace`

## No Migration Needed

`is_bank_wide` field and its migration already exist. Only need new view + URL + serializer fields if needed.
