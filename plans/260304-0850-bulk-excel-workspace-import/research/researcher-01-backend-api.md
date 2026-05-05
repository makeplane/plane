# Researcher 01: Backend API & CSV Import Reference

## Existing CSV Bulk Import (Users)

**File**: `apps/api/plane/license/api/views/user_bulk_import.py`

- Class: `InstanceUserBulkImportEndpoint(BaseAPIView)`
- Permission: `InstanceAdminPermission`
- Parser: `MultiPartParser` (multipart/form-data)
- URL: `users/bulk-import/` (in `plane/license/urls.py`)
- Parses CSV via Python stdlib `csv`, `io` modules
- Returns: `{ created, skipped, total_created, total_skipped }`
- Max rows: 500, max file: 5MB

## Workspace Creation API

**File**: `apps/api/plane/license/api/views/workspace.py`

- Class: `InstanceWorkSpaceEndpoint`
- `POST /god-mode/workspaces/` — creates single workspace
- Required fields: `name` (max 80), `slug` (max 48)
- Optional: `company_role`, `organization_size`, `timezone`
- Validates: slug uniqueness (case-insensitive), RESTRICTED_WORKSPACE_SLUGS
- On success: creates `WorkspaceMember` (role=20/Admin) for request.user
- Returns 201 with serialized workspace

**Serializer**: `apps/api/plane/license/api/serializers/workspace.py`

- Validates slug uniqueness in `validate_slug()`
- Fields: all (model fields)

**URL Routing**: `apps/api/plane/license/urls.py`

- Pattern: `path("workspaces/", InstanceWorkSpaceEndpoint...)`
- Views imported from `plane.license.api.views`
- `__init__.py` exports all views

## Workspace Model Fields (relevant)

- `name` CharField(80) — required
- `slug` SlugField(48) — required, unique
- `organization_size` CharField(20) — optional
- `timezone` CharField — optional, pytz choices

## Proposed Backend Endpoint

New endpoint: `POST /god-mode/workspaces/bulk-create/`

- Accept JSON: `{ "workspaces": [{ name, slug, organization_size? }] }`
- Validate each workspace (same rules as single create)
- Create valid ones, collect errors for invalid ones
- Return: `{ created, skipped, total_created, total_skipped }`
- Permission: `InstanceAdminPermission`

## Notes

- Existing single create endpoint can be reused per-workspace in a loop (but bulk is more efficient)
- No Python Excel library needed if frontend parses Excel to JSON
- openpyxl would be needed if backend parses Excel files
