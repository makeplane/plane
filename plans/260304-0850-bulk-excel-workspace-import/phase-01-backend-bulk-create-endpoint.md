# Phase 01: Backend — Bulk Create Workspace Endpoint

## Context Links

- Parent plan: [plan.md](./plan.md)
- Reference: [researcher-01-backend-api.md](./research/researcher-01-backend-api.md)
- Reference: `apps/api/plane/license/api/views/user_bulk_import.py` (CSV import pattern)
- Reference: `apps/api/plane/license/api/views/workspace.py` (single create logic)
- Reference: `apps/api/plane/license/urls.py` (URL routing)

## Overview

- **Date**: 2026-03-04
- **Priority**: P1 (blocks Phase 02)
- **Status**: complete
- **Description**: Add `POST /god-mode/workspaces/bulk-create/` endpoint that accepts a JSON array of workspace objects, validates each, creates valid ones, and returns a summary with skipped items.

## Key Insights

- Existing `InstanceWorkSpaceEndpoint.post()` handles single workspace creation — reuse its validation logic
- Slug must be unique (case-insensitive) and not in `RESTRICTED_WORKSPACE_SLUGS`
- On creation, a `WorkspaceMember` (role=20, Admin) must be created for `request.user`
- The `WorkspaceSerializer.validate_slug()` checks uniqueness — call it or replicate inline per row
- Python `json` parsing of request body is simpler than CSV; use `request.data` (DRF handles it)
- Max 200 workspaces per import (reasonable limit, avoid DB overload)

## Requirements

<!-- Updated: Validation Session 1 - Slug auto-generated from name; removed slug from input -->

### Functional

- Accept `POST` with JSON body: `{"workspaces": [{name, organization_size?}, ...]}`
- **Slug**: Auto-generated from `name` using `django.utils.text.slugify(name)`. If collision, append numeric suffix (`-1`, `-2`, etc.) until unique
- Validate each row: name required (≤80 chars)
- Skip invalid rows with reason; create valid ones
- Return: `{ created: [...], skipped: [{row_number, name, generated_slug, reason}], total_created, total_skipped }`
- Permission: `InstanceAdminPermission` (admin-only)

### Non-Functional

- Max 200 workspaces per request (return 400 if exceeded)
- Use DB transaction or per-item try/except (per-item is safer for partial success)
- No new Python dependencies

## Architecture

```
POST /god-mode/workspaces/bulk-create/
  ↓ InstanceWorkspaceBulkCreateEndpoint
  ↓ InstanceAdminPermission check
  ↓ Parse request.data["workspaces"] list
  ↓ For each workspace:
      - Validate name, slug (length, uniqueness, restricted)
      - Create Workspace + WorkspaceMember
      - Collect result/error
  ↓ Return summary JSON
```

## Related Code Files

**Create:**

- `apps/api/plane/license/api/views/workspace_bulk_create.py`

**Modify:**

- `apps/api/plane/license/api/views/__init__.py` — add export
- `apps/api/plane/license/urls.py` — add URL pattern

## Embedded Rules (Phase-Specific)

### Rule 1 — BaseAPIView Pattern

All license views extend `plane.license.api.views.base.BaseAPIView`, use `InstanceAdminPermission`.

### Rule 2 — Slug Auto-Generation

<!-- Updated: Validation Session 1 - Slug is auto-generated, not user-supplied -->

```python
from django.utils.text import slugify
from plane.utils.constants import RESTRICTED_WORKSPACE_SLUGS
from plane.db.models import Workspace

def _generate_unique_slug(name, existing_slugs):
    base = slugify(name)[:48]
    if not base:
        return None  # name produces empty slug
    candidate = base
    counter = 1
    while candidate.lower() in existing_slugs or candidate in RESTRICTED_WORKSPACE_SLUGS:
        suffix = f"-{counter}"
        candidate = base[:48 - len(suffix)] + suffix
        counter += 1
    return candidate
```

### Rule 3 — WorkspaceMember Creation

After creating workspace, always create `WorkspaceMember(workspace=ws, member=request.user, role=20)`.

### Rule 4 — Response Format (match user bulk import pattern)

```python
return Response({
    "created": [...serialized workspaces...],
    "skipped": [{"row_number": N, "name": "...", "slug": "...", "reason": "..."}],
    "total_created": len(created),
    "total_skipped": len(skipped),
}, status=status.HTTP_200_OK)
```

### Rule 5 — No new deps

Do not add openpyxl or any Excel library to backend. Frontend parses Excel to JSON.

## Implementation Steps

1. **Create** `apps/api/plane/license/api/views/workspace_bulk_create.py`:

   ```python
   # Imports: BaseAPIView, InstanceAdminPermission, Workspace, WorkspaceMember,
   #          RESTRICTED_WORKSPACE_SLUGS, slugify
   # Class: InstanceWorkspaceBulkCreateEndpoint(BaseAPIView)
   # permission_classes = [InstanceAdminPermission]

   # def post(self, request):
   #   workspaces_data = request.data.get("workspaces", [])
   #   Validate it's a list, length <= 200
   #   Pre-fetch all existing slugs (lowercase set) for O(1) lookup
   #   For each item (with row_number starting at 1):
   #     - Validate name (required, <= 80 chars)
   #     - Auto-generate slug using _generate_unique_slug(name, existing_slugs) [Rule 2]
   #     - If slug generation fails (empty name after slugify), skip with reason
   #     - Try: Create Workspace(name, slug, organization_size, owner=request.user)
   #              + WorkspaceMember(workspace, member=request.user, role=20)
   #     - On success: add slug to existing_slugs set (prevent duplicates within batch)
   #     - On error (IntegrityError): append to skipped
   #   Return summary with generated_slug in each created/skipped item
   ```

2. **Modify** `apps/api/plane/license/api/views/__init__.py`:
   - Add: `from plane.license.api.views.workspace_bulk_create import InstanceWorkspaceBulkCreateEndpoint`

3. **Modify** `apps/api/plane/license/urls.py`:
   - Import `InstanceWorkspaceBulkCreateEndpoint`
   - Add before or after existing workspace URL:
     ```python
     path("workspaces/bulk-create/", InstanceWorkspaceBulkCreateEndpoint.as_view(), name="instance-workspace-bulk-create"),
     ```

4. **Verify** by running Django check: `python manage.py check` (no compile errors)

## Todo List

- [ ] Create `workspace_bulk_create.py` view
- [ ] Export from `views/__init__.py`
- [ ] Register URL in `urls.py`
- [ ] Test endpoint manually or verify logic (no syntax errors)

## Success Criteria

- `POST /god-mode/workspaces/bulk-create/` returns 200 with `{ created, skipped, total_created, total_skipped }`
- Invalid rows (duplicate slug, missing name, etc.) are in `skipped` with reason
- Valid rows get a Workspace + WorkspaceMember created in DB
- Returns 400 for empty body or > 200 items

## Risk Assessment

| Risk                        | Mitigation                                                                     |
| --------------------------- | ------------------------------------------------------------------------------ |
| Partial failure mid-batch   | Per-item try/except (not a single transaction) — partial success is acceptable |
| Slug collision within batch | Collect slugs in a set as we create; check set before DB insert                |
| DB IntegrityError on slug   | Catch IntegrityError, add to skipped                                           |

## Security Considerations

- `InstanceAdminPermission` — only god-mode admins can call this
- Input validation: name, slug length limits enforced before DB write
- No file upload — JSON body only (no path traversal risk)

## Next Steps

After Phase 01 complete → Phase 02: Frontend Excel Import UI
