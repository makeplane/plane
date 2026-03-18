# Phase 02 — Backend Bulk Import

**Plan:** [plan.md](./plan.md) | **Prev:** [phase-01-backend-export.md](./phase-01-backend-export.md) | **Next:** [phase-03-frontend-service-store.md](./phase-03-frontend-service-store.md)

## Overview

| Field | Value |
|---|---|
| Date | 2026-03-17 |
| Description | Add `POST /api/instances/departments/bulk-import/` — validate, sort, batch-create departments |
| Priority | P2 |
| Status | ⬜ pending |

## Requirements

- `POST /api/instances/departments/bulk-import/`
- Request: `{ "departments": [{ name, code, short_name, dept_code, dept_type, parent_code, manager_email, sort_order, is_active }] }`
- Response: `{ created: [], skipped: [{ row_number, name, reason }], total_created, total_skipped }`
- Two-pass: validate all rows first, then topological sort for parent-child ordering
- Batch create in single Django `atomic()` transaction
- Permission: `InstanceAdminPermission`
- Max 500 rows per request

## Architecture

```
DepartmentBulkImportView (POST)
  ├── Pass 1 — Row validation (per-row, collect skipped)
  │    ├── name required, ≤100 chars
  │    ├── short_name: ≥2 chars, uppercase, unique (case-insensitive, soft-delete aware)
  │    ├── dept_code: exactly 4 digits
  │    ├── dept_type: HO | BRX | OSR (or empty)
  │    ├── parent_code: if set, must exist in DB or in same batch
  │    └── manager_email: if set, user must exist
  │
  ├── Pass 2 — Topological sort of valid rows
  │    └── Process root rows first, then children (BFS by level)
  │
  └── Pass 3 — Batch create in atomic()
       ├── Resolve parent FK from code (DB lookup + in-batch map)
       ├── Resolve manager FK from email
       ├── Calculate level = parent.level + 1 (or 0 if root), max 6
       └── Collect created / skipped (IntegrityError → skipped)
```

## Model Constraints to Enforce

| Field | Constraint |
|---|---|
| `name` | required, ≤100 chars |
| `short_name` | ≥2 chars, uppercase, unique across non-deleted depts |
| `dept_code` | exactly 4 digits `[0-9]{4}` |
| `dept_type` | `HO`, `BRX`, `OSR`, or empty/null |
| `level` | auto-calculated, max 6 |
| circular parent | parent_code must not create cycle |

## Related Code Files

- `apps/api/plane/license/api/views/department.py` — add `DepartmentBulkImportView`
- `apps/api/plane/license/api/urls/department.py` — register `departments/bulk-import/`
- Reference: `apps/api/plane/license/api/views/workspace_bulk_create.py`
- Model: `apps/api/plane/db/models/department.py`

## Implementation Steps

1. Create new file `apps/api/plane/license/api/views/department_bulk_import.py`:
   - `DepartmentBulkImportView` class with `post()` method
   - `_validate_row(row, row_number, existing_short_names, existing_codes_in_batch)` helper
   - `_topological_sort(valid_rows)` helper — BFS by parent_code dependency
   - `_resolve_and_create(sorted_rows, request)` helper — atomic batch creation
2. Import `DepartmentBulkImportView` in `department.py` URLs
3. Register URL: `path("departments/bulk-import/", ..., http_method_names=["post"])`

## Todo

- [ ] Create `department_bulk_import.py` with `DepartmentBulkImportView`
- [ ] Implement row validation (Pass 1)
- [ ] Implement topological sort (Pass 2)
- [ ] Implement atomic batch create (Pass 3)
- [ ] Register URL in `urls/department.py`
- [ ] Manual test: valid batch, partial skip (bad short_name), parent-child ordering

## Success Criteria

- Valid rows created, invalid rows returned in `skipped` with clear reasons
- Parent-child batches work (child references parent in same batch)
- `short_name` uniqueness enforced cross-batch and against existing DB
- Exceeding max 6 levels → skipped with reason
- Circular parent reference → skipped with reason
- Empty valid batch after filtering → 200 with `total_created: 0`

## Risk Assessment

- Topological sort complexity: simple BFS is sufficient for ≤500 rows and max 6 levels
- Circular references: detect by checking if parent_code ever matches self, or track visited set in BFS
- Concurrent imports: two simultaneous imports with same `short_name` → `IntegrityError` caught → skipped

## Security Considerations

- `InstanceAdminPermission` required
- Validate all string inputs (strip whitespace, limit lengths)
- `dept_code` regex enforced to prevent injection
- `manager_email` lookup uses `User.objects.filter(email=...)` — no raw SQL
