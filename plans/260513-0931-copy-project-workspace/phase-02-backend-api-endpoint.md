# Phase 02 — Backend: API Endpoint + Permissions

## Overview

- **Priority:** P1
- **Status:** complete
- **Effort:** 3h
- **Description:** Expose two endpoints — trigger copy (POST) and poll status (GET) — with admin-only permissions.

## Context Links

- Pattern reference: existing project view at `apps/api/plane/app/views/project/`
- Permission helper: `apps/api/plane/utils/instance_admin.py` (`is_instance_admin`)
- Permission decorator: `apps/api/plane/app/permissions/__init__.py` (`ROLE`, `allow_permission`)
- Backend rules: `.claude/rules/plane-backend-architecture.md`, `backend-views.md`

## Requirements

### Functional

- `POST /api/workspaces/{slug}/projects/{project_id}/copy/`
  - Body: `{ target_workspace_slug: str, target_identifier: str, target_name: str }`
  - Auth: source workspace ADMIN (role=20) OR instance admin
  - Auth: target workspace ADMIN OR instance admin (same user must admin both)
  - Validates: target_workspace exists, user is admin of both, target_identifier is unique in target workspace, identifier matches `^[A-Z0-9]{1,12}$`
  - Creates `ProjectCopyJob`, fires `copy_project_task.delay(str(job.id))`
  - Returns `202 Accepted` with `{ job_id, status: "queued" }`
- `GET /api/workspaces/{slug}/projects/{project_id}/copy-status/{job_id}/`
  - Auth: same admin check, OR job.created_by == request.user
  - Returns `{ id, status, new_project_id, error, target_workspace_slug, target_identifier, target_name, created_at, completed_at }`
- `GET /api/workspaces/{slug}/projects/{project_id}/copy/admin-workspaces/` (helper)
  - Returns list of workspaces where request.user is admin (excluding source workspace), for the modal's workspace picker

### Non-Functional

- Internal API layer `plane/app/` (frontend-only, session auth, no `@extend_schema`)
- All responses paginated where applicable; this endpoint returns single object — no pagination

## Architecture

### URL Registration

In `apps/api/plane/app/urls/project.py`:

```python
path(
    "workspaces/<str:slug>/projects/<uuid:project_id>/copy/",
    ProjectCopyViewSet.as_view({"post": "create"}),
    name="project-copy",
),
path(
    "workspaces/<str:slug>/projects/<uuid:project_id>/copy-status/<uuid:job_id>/",
    ProjectCopyViewSet.as_view({"get": "status"}),
    name="project-copy-status",
),
path(
    "workspaces/<str:slug>/projects/<uuid:project_id>/copy/admin-workspaces/",
    ProjectCopyViewSet.as_view({"get": "admin_workspaces"}),
    name="project-copy-admin-workspaces",
),
```

### ViewSet `ProjectCopyViewSet` (apps/api/plane/app/views/project/copy.py)

```python
class ProjectCopyViewSet(BaseViewSet):
    model = ProjectCopyJob
    serializer_class = ProjectCopyJobSerializer

    def _user_is_admin(self, user, workspace_slug):
        from plane.utils.instance_admin import is_instance_admin
        if is_instance_admin(user):
            return True
        return WorkspaceMember.objects.filter(
            workspace__slug=workspace_slug,
            member=user,
            role=20,
            is_active=True,
        ).exists()

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def create(self, request, slug, project_id):
        target_slug = request.data.get("target_workspace_slug")
        target_identifier = request.data.get("target_identifier", "").strip().upper()
        target_name = request.data.get("target_name", "").strip()

        # 1. Validate target admin
        if not self._user_is_admin(request.user, target_slug):
            return Response({"error": "Not admin of target workspace"}, status=403)

        # 2. Validate identifier format
        if not re.match(r"^[A-Z0-9]{1,12}$", target_identifier):
            return Response({"error": "Invalid identifier format"}, status=400)

        # 3. Validate identifier uniqueness in target
        target_workspace = Workspace.objects.get(slug=target_slug)
        if Project.objects.filter(workspace=target_workspace, identifier=target_identifier).exists():
            return Response({"error": "identifier_taken"}, status=409)

        # 4. Create job + fire task
        job = ProjectCopyJob.objects.create(
            source_project_id=project_id,
            target_workspace=target_workspace,
            target_identifier=target_identifier,
            target_name=target_name,
            created_by=request.user,
        )
        copy_project_task.delay(str(job.id))
        return Response({"job_id": str(job.id), "status": "queued"}, status=202)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def status(self, request, slug, project_id, job_id):
        job = ProjectCopyJob.objects.filter(id=job_id, source_project_id=project_id).first()
        if not job:
            return Response({"error": "not_found"}, status=404)
        # Only creator or admin can read
        if job.created_by_id != request.user.id and not self._user_is_admin(request.user, slug):
            return Response({"error": "forbidden"}, status=403)
        return Response(ProjectCopyJobSerializer(job).data)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def admin_workspaces(self, request, slug, project_id):
        from plane.utils.instance_admin import is_instance_admin
        if is_instance_admin(request.user):
            qs = Workspace.objects.all()
        else:
            admin_workspace_ids = WorkspaceMember.objects.filter(
                member=request.user, role=20, is_active=True
            ).values_list("workspace_id", flat=True)
            qs = Workspace.objects.filter(id__in=admin_workspace_ids)
        qs = qs.exclude(slug=slug)  # exclude source
        return Response(WorkspaceLiteSerializer(qs, many=True).data)
```

### Serializer (apps/api/plane/app/serializers/project_copy.py)

```python
class ProjectCopyJobSerializer(BaseSerializer):
    target_workspace_slug = serializers.CharField(source="target_workspace.slug", read_only=True)
    new_project_id = serializers.UUIDField(source="new_project_id", read_only=True)

    class Meta:
        model = ProjectCopyJob
        fields = ["id", "status", "new_project_id", "error", "target_workspace_slug",
                  "target_identifier", "target_name", "created_at", "completed_at"]
        read_only_fields = fields
```

## Related Code Files

### To Create

- `apps/api/plane/app/views/project/copy.py` — ProjectCopyViewSet
- `apps/api/plane/app/serializers/project_copy.py` — ProjectCopyJobSerializer

### To Modify

- `apps/api/plane/app/views/project/__init__.py` — export ProjectCopyViewSet
- `apps/api/plane/app/serializers/__init__.py` — export serializer
- `apps/api/plane/app/urls/project.py` — register 3 URLs

### To Read for Context

- `apps/api/plane/app/views/project/base.py` — existing project viewset patterns
- `apps/api/plane/app/permissions/__init__.py` — `allow_permission`, `ROLE`
- `apps/api/plane/utils/instance_admin.py` — `is_instance_admin`

## Implementation Steps

1. Create serializer file + register
2. Create viewset file with 3 actions
3. Register viewset in `views/project/__init__.py`
4. Add 3 URL patterns to `urls/project.py`
5. Write contract tests (`apps/api/plane/tests/views/test_project_copy.py`):
   - `test_create_returns_202_with_job_id`
   - `test_create_403_when_not_source_admin`
   - `test_create_403_when_not_target_admin`
   - `test_create_409_when_identifier_taken`
   - `test_create_400_when_identifier_invalid_format`
   - `test_status_returns_job_state`
   - `test_status_403_when_not_creator_and_not_admin`
   - `test_admin_workspaces_excludes_source`
   - `test_admin_workspaces_returns_only_admin_memberships`

## Todo List

- [x] Create ProjectCopyJobSerializer
- [x] Create ProjectCopyViewSet with 3 actions
- [x] Register in `__init__.py` files
- [x] Register 3 URLs
- [x] 9 contract tests above
- [x] `python run_tests.py -c` green

## Success Criteria

- All 9 contract tests pass
- Manual `curl` POST returns 202 + job_id, GET returns status
- Manual `curl` with non-admin token returns 403
- `gitnexus_impact({target: "ProjectCopyViewSet"})` shows expected callers (URL routes only)

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Identifier validation regex too strict/loose vs frontend | Share regex via translation key; document in serializer docstring |
| TOCTOU race on identifier uniqueness | DB unique constraint `(workspace, identifier)` catches; return 409 on IntegrityError |
| `@allow_permission` decorator behavior on non-existent project | Returns 404 naturally — verify in test |
| `is_instance_admin` import cycle | Lazy-import inside method (already done in pattern) |

## Security Considerations

- Two-level admin check (source + target) prevents cross-workspace privilege escalation
- Status endpoint scopes by `created_by_id` to prevent enumeration of others' jobs
- `target_identifier` uppercased + regex-validated to prevent injection

## Next Steps

- Unblocks Phase 04 (service calls these endpoints)
