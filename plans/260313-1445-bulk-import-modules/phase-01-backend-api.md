# Phase 01: Backend API

## Context Links

- [Plan Overview](./plan.md)
- Pattern: `apps/api/plane/license/api/views/workspace_project_bulk_import.py`
- Module model: `apps/api/plane/db/models/module.py`
- URL registration: `apps/api/plane/license/urls.py`

## Overview

| Field       | Value                                                                                                                               |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Priority    | P2                                                                                                                                  |
| Status      | ⬜ pending                                                                                                                          |
| Effort      | 1.5h                                                                                                                                |
| Description | New `InstanceWorkspaceModuleBulkImportEndpoint` — imports Modules into projects via JSON array, mirrors project bulk import pattern |

## Key Insights

- Module unique constraint: `UniqueConstraint(fields=["name", "project"], condition=Q(deleted_at__isnull=True))` — duplicate check must include `deleted_at__isnull=True`
- Module `status` is optional in request; validate against `VALID_STATUSES = {"backlog","planned","in-progress","paused","completed","cancelled"}`; default `"planned"` if blank/invalid
<!-- Updated: Validation Session 1 - status is optional Excel column, not hard-coded -->
- Double cache needed: `workspace_cache` (slug→Workspace) + `project_cache` (f"{slug}:{identifier}"→Project)
- `ProjectBaseModel` provides `workspace`, `project`, `created_by`, `updated_by` — all set on create
- Date parsing: `datetime.strptime(val, "%Y-%m-%d").date()` in try/except → None on failure, row continues
- No `ProjectIdentifier`, `State`, `ProjectMember` creation needed — just one `Module.objects.create()`
- File will be ~150 lines — well within 200-line limit

## Requirements

- `POST /api/instances/bulk-import-modules/`
- Auth: `InstanceAdminPermission`
- Body: `{ "modules": [{ "workspace_slug", "project_identifier", "name", "description"?, "start_date"?, "target_date"? }] }`
- Max 100 rows per request
- Per-row validation: `workspace_slug` required, `project_identifier` required, `name` required (≤255 chars)
- Skip row if duplicate module name in project (soft-delete aware)
- Invalid date format → null the date field, continue processing row
- Response: `{ created, skipped, total_created, total_skipped }`
- Register endpoint in `apps/api/plane/license/urls.py`
- Export view class in `apps/api/plane/license/api/views/__init__.py`

## Architecture

```
POST /api/instances/bulk-import-modules/
  body: { modules: [{ workspace_slug, project_identifier, name, description?, start_date?, target_date? }] }

workspace_cache = {}    # slug → Workspace | None
project_cache = {}      # "slug:identifier" → Project | None

for row_number, item in enumerate(modules_data, start=1):
    # Extract + strip fields
    workspace_slug = str(item.get("workspace_slug") or "").strip()
    project_identifier = str(item.get("project_identifier") or "").strip().upper()
    name = str(item.get("name") or "").strip()

    # Validate workspace_slug
    if not workspace_slug → skip

    # Resolve workspace (cache)
    workspace = workspace_cache.setdefault(workspace_slug, Workspace.objects.filter(slug=workspace_slug).first())
    if workspace is None → skip

    # Validate project_identifier
    if not project_identifier → skip

    # Resolve project (cache by "slug:identifier")
    cache_key = f"{workspace_slug}:{project_identifier}"
    if cache_key not in project_cache:
        project_cache[cache_key] = Project.objects.filter(
            identifier=project_identifier, workspace=workspace, deleted_at__isnull=True
        ).first()
    project = project_cache[cache_key]
    if project is None → skip

    # Validate name
    if not name or len(name) > 255 → skip

    # Duplicate check (soft-delete aware)
    if Module.objects.filter(name=name, project=project, deleted_at__isnull=True).exists():
        skip with reason "Module name already exists in this project"

    # Parse dates (fail-safe)
    start_date = _parse_date(item.get("start_date"))   # None on failure
    target_date = _parse_date(item.get("target_date"))

    # Create module
    Module.objects.create(
        name=name,
        description=str(item.get("description") or "").strip(),
        start_date=start_date,
        target_date=target_date,
        status=_parse_status(item.get("status")),  # validated against VALID_STATUSES, defaults "planned"
        project=project,
        workspace=workspace,
        created_by=request.user,
        updated_by=request.user,
    )
    created.append({"workspace_slug", "project_identifier", "name"})

return { created, skipped, total_created, total_skipped }
```

## Related Code Files

- **Create:** `apps/api/plane/license/api/views/workspace_module_bulk_import.py`
- **Modify:** `apps/api/plane/license/api/views/__init__.py` — add export
- **Modify:** `apps/api/plane/license/urls.py` — register URL

## Embedded Rules

```
- BaseAPIView inheritance (not BaseViewSet — this is a license/God Mode view)
- InstanceAdminPermission — already the pattern in workspace_project_bulk_import.py
- select_related() not needed on Module.create() — only use if doing lookups that would cause N+1
- Per-row try/except IntegrityError + generic Exception: collect in skipped[], never abort batch
- logger.exception() for unexpected errors — never expose raw tracebacks to client
- No transaction.atomic() needed for single-object create (unlike project import which creates 4 objects)
- Register in __init__.py or imports will fail silently
- kebab-case filename: workspace_module_bulk_import.py (snake_case for Python)
```

## Implementation Steps

1. **Create `_parse_date()` and `_parse_status()` helpers** at module level:
   <!-- Updated: Validation Session 1 - add _parse_status helper -->

   ```python
   from datetime import datetime

   VALID_STATUSES = {"backlog", "planned", "in-progress", "paused", "completed", "cancelled"}

   def _parse_date(val):
       if not val:
           return None
       try:
           return datetime.strptime(str(val).strip(), "%Y-%m-%d").date()
       except (ValueError, TypeError):
           return None

   def _parse_status(val):
       """Return val if it's a valid Module status, else 'planned'."""
       s = str(val or "").strip().lower()
       return s if s in VALID_STATUSES else "planned"
   ```

2. **Create `InstanceWorkspaceModuleBulkImportEndpoint(BaseAPIView)`** class:
   - `permission_classes = [InstanceAdminPermission]`
   - `MAX_MODULES = 100`
   - `post(self, request)` method following the architecture pseudocode above

3. **Imports needed:**

   ```python
   import logging
   from rest_framework import status
   from rest_framework.response import Response
   from plane.app.views.base import BaseAPIView
   from plane.db.models import Module, Project, Workspace
   from plane.license.api.permissions import InstanceAdminPermission
   ```

4. **Export in `__init__.py`:**

   ```python
   from .workspace_module_bulk_import import InstanceWorkspaceModuleBulkImportEndpoint
   ```

5. **Register URL in `urls.py`:**
   ```python
   path("bulk-import-modules/", InstanceWorkspaceModuleBulkImportEndpoint.as_view(), name="instance-bulk-import-modules"),
   ```

## Post-Phase Checklist

- [ ] `InstanceAdminPermission` in `permission_classes` — God Mode only
- [ ] Duplicate check includes `deleted_at__isnull=True` — soft-delete aware
- [ ] `project_identifier` resolved with `deleted_at__isnull=True` on Project lookup
- [ ] Date parse failure → `None`, row continues (not skipped)
- [ ] `try/except IntegrityError` + generic `Exception` per row with logger
- [ ] View exported in `__init__.py`
- [ ] URL registered in `urls.py`
- [ ] Python import test: `cd apps/api && python -c "from plane.license.api.views import InstanceWorkspaceModuleBulkImportEndpoint; print('OK')"`
- [ ] File ≤200 lines

## Todo List

- [ ] Create `apps/api/plane/license/api/views/workspace_module_bulk_import.py`
- [ ] Add `_parse_date()` helper
- [ ] Implement `InstanceWorkspaceModuleBulkImportEndpoint` with `post()` method
- [ ] Export in `apps/api/plane/license/api/views/__init__.py`
- [ ] Register URL in `apps/api/plane/license/urls.py`
- [ ] Run Python import test
- [ ] Run post-phase checklist
- [ ] Mark phase complete in plan.md

## Success Criteria

- `POST /api/instances/bulk-import-modules/` with valid rows → modules created, response has `created[]`
- Duplicate module name → row in `skipped[]` with reason "Module name already exists in this project"
- Invalid `workspace_slug` or `project_identifier` → row in `skipped[]` with clear reason
- Invalid date format → date field null, module still created
- Max 100 rows enforced; 101+ → 400 error
- Python import succeeds; no runtime errors on first call

## Risk Assessment

- **Project soft-delete:** `Project.objects.filter(..., deleted_at__isnull=True)` — must exclude deleted projects from lookup
- **Concurrent creates:** duplicate module name in same batch — IntegrityError caught per-row, no batch abort
- **Missing Module import:** `plane.db.models` must export `Module` — verify in `__init__.py`

## Security Considerations

- `InstanceAdminPermission` restricts to God Mode admins (role ≥ 15)
- No cross-workspace data access — workspace resolved per row from request data
- User-supplied strings stripped and validated before DB operations

## Next Steps

- Phase 02 (Frontend) depends on this phase being complete and tested
- Frontend needs to know response shape: `{ created, skipped, total_created, total_skipped }`
