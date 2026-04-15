---
title: "Phase 01 — Backend API"
status: pending
priority: P2
effort: 2h
---

# Phase 01 — Backend API

## Context

- Parent plan: [plan.md](./plan.md)
- Reference: `apps/api/plane/license/api/views/staff.py` (`InstanceStaffBulkImportEndpoint`)
- Instance department views: `apps/api/plane/license/api/views/department.py`
- Instance department URLs: `apps/api/plane/license/api/urls/department.py`

## Overview

Add `POST /api/instances/departments/bulk-upload/` endpoint.

## Department Model Fields (CSV columns)

| CSV Column          | Model Field           | Required | Validation                     |
| ------------------- | --------------------- | -------- | ------------------------------ |
| `name`              | `name` (max 255)      | ✅       | non-empty                      |
| `code`              | `code` (max 20)       | ❌       | -                              |
| `short_name`        | `short_name` (max 10) | ❌       | uppercase, min 2 chars, unique |
| `dept_code`         | `dept_code` (max 4)   | ❌       | exactly 4 digits               |
| `description`       | `description`         | ❌       | -                              |
| `dept_type`         | `dept_type`           | ❌       | HO / BRX / OSR                 |
| `parent_short_name` | `parent` (FK lookup)  | ❌       | lookup by short_name           |
| `level`             | `level`               | ❌       | 1–6                            |
| `is_active`         | `is_active`           | ❌       | true/false                     |

## Architecture

```
POST /api/instances/departments/bulk-upload/
Content-Type: multipart/form-data
  file: <CSV file>
  skip_existing: bool (skip if short_name already exists)

Response:
{
  "created": 5,
  "skipped": 2,
  "errors": [
    { "row": 3, "name": "Dept A", "reason": "short_name must be unique" }
  ]
}
```

## Related Code Files

- `apps/api/plane/license/api/views/staff.py` — `InstanceStaffBulkImportEndpoint` (reference)
- `apps/api/plane/license/api/views/department.py` — add new endpoint class here
- `apps/api/plane/license/api/urls/department.py` — register new URL
- `apps/api/plane/db/models/department.py` — model reference
- `apps/api/plane/app/serializers/department.py` — serializer reference

## Implementation Steps

### 1. Add `InstanceDepartmentBulkUploadEndpoint` view

File: `apps/api/plane/license/api/views/department.py`

```python
class InstanceDepartmentBulkUploadEndpoint(BaseAPIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get("file")
        skip_existing = request.data.get("skip_existing", "false").lower() == "true"

        # Validate file presence + size (max 5MB) + extension (.csv)
        # Parse CSV with csv.DictReader
        # Validate max rows (1000)
        # For each row: validate required fields, lookup parent by short_name
        # Create Department objects, track created/skipped/errors
        # Return summary response
```

### 2. Register URL

File: `apps/api/plane/license/api/urls/department.py`

```python
path("departments/bulk-upload/", InstanceDepartmentBulkUploadEndpoint.as_view(), name="instance-department-bulk-upload"),
```

## Todo

- [ ] Add `InstanceDepartmentBulkUploadEndpoint` class in `views/department.py`
- [ ] Import `MultiPartParser`, `FormParser`, `csv`, `io` in views file
- [ ] Register URL in `urls/department.py`
- [ ] Validate: file required, max 5MB, `.csv` extension only
- [ ] Validate: max 1000 rows per upload
- [ ] Per-row: validate `name` non-empty, `dept_type` in choices, `dept_code` 4-digit, `short_name` unique
- [ ] Parent lookup: find by `short_name` if `parent_short_name` provided
- [ ] `skip_existing`: skip rows where `short_name` already exists (no error)
- [ ] Return `{ created, skipped, errors: [{row, name, reason}] }`
- [ ] Test manually with curl / Postman

## Success Criteria

- Endpoint accepts CSV, creates valid rows, returns per-row error details
- Duplicate `short_name` → skipped (if flag) or error
- Invalid CSV rows don't abort entire batch

## Risk Assessment

- Parent dept lookup by `short_name`: parent must exist before child rows — recommend ordering CSV top-down
- Unique constraint on `short_name`: enforce at DB level, catch IntegrityError per row

## Security Considerations

- Validate file is `.csv` (not arbitrary upload)
- Limit file size (5MB) and row count (1000)
- Instance admin permission check (inherits from `BaseAPIView`)

## Next Steps

After this phase → Phase 02 (Frontend UI)
