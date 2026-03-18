# Phase 01 — Backend Export

**Plan:** [plan.md](./plan.md) | **Next:** [phase-02-backend-bulk-import.md](./phase-02-backend-bulk-import.md)

## Overview

| Field | Value |
|---|---|
| Date | 2026-03-17 |
| Description | Add `GET /api/instances/departments/export/` — streams flat XLSX of all departments |
| Priority | P2 |
| Status | ⬜ pending |

## Requirements

<!-- Updated: Validation Session 1 - XLSX only, removed CSV support -->
- `GET /api/instances/departments/export/` — always returns XLSX (no format param)
- Flat list — hierarchy via `parent_code` column
- Columns: `name, code, short_name, dept_code, dept_type, parent_code, manager_email, sort_order, is_active, level`
- Permission: `InstanceAdminPermission`
- Doubles as import template (same column headers)
- Download triggered via `window.open()` from frontend — no blob/streaming complexity

## Architecture

<!-- Updated: Validation Session 1 - XLSX only -->
```
DepartmentExportView (GET)
  └── Query all departments (soft-delete filter)
  └── Build flat rows (resolve parent.code, manager.email)
  └── Return XLSX: openpyxl workbook → HttpResponse
       content-type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
       content-disposition: attachment; filename="departments.xlsx"
```

## Related Code Files

- `apps/api/plane/license/api/views/department.py` — add `DepartmentExportView` class
- `apps/api/plane/license/api/urls/department.py` — register `departments/export/` route

## Implementation Steps

<!-- Updated: Validation Session 1 - removed _csv_response -->
1. In `department.py` views, add `DepartmentExportView`:
   ```python
   class DepartmentExportView(BaseAPIView):
       permission_classes = [InstanceAdminPermission]

       def get(self, request):
           departments = (
               Department.objects.filter(deleted_at__isnull=True)
               .select_related("parent", "manager")
               .order_by("level", "sort_order", "name")
           )
           rows = [_dept_to_row(d) for d in departments]
           return _xlsx_response(rows)
   ```
2. Add helper `_dept_to_row(dept)` → dict with all 10 columns
3. Add `_xlsx_response(rows)` using `openpyxl` (already in Django stack)
4. Register URL: `path("departments/export/", DepartmentExportView.as_view(http_method_names=["get"]), name="instance-department-export")`

## Todo

- [ ] Add `DepartmentExportView` to `department.py`
- [ ] Add `_dept_to_row`, `_xlsx_response` helpers (no CSV needed)
- [ ] Register URL in `department.py` urls (before `<uuid:pk>/` to avoid routing conflict)
- [ ] Manual test: `GET /api/instances/departments/export/` downloads valid XLSX

## Success Criteria

- Download returns valid `.xlsx` with correct headers and data
- `parent_code` correctly resolves to parent's `code` field (or empty if root)
- `manager_email` correctly resolves to manager's email (or empty)
- Empty departments table returns file with header row only (valid import template)

## Risk Assessment

- `openpyxl` must be available in backend requirements — verify before implementing
- URL order: `departments/export/` must be registered **before** `departments/<uuid:pk>/`

## Security Considerations

- `InstanceAdminPermission` ensures only god-mode admins can export
- No user PII beyond email (already accessible to instance admins)
