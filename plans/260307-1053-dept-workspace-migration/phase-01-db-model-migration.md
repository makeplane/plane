# Phase 1: DB Model Migration

## Context Links

- [Plan Overview](./plan.md)
- [Brainstorm Report](./reports/brainstorm-260307-1053-department-workspace-model-migration.md)
- Current models: `apps/api/plane/db/models/department.py`, `apps/api/plane/db/models/staff.py`

## Overview

- **Priority:** P1 (blocking all other phases)
- **Status:** completed
- **Effort:** 4h
- Remove `workspace` FK from Department and StaffProfile. Remove `linked_project` FK from Department. Add `linked_workspace` OneToOneField(nullable) to Department. Update unique constraints to instance-level scope.

## Key Insights

- Department currently has 3 workspace-scoped unique constraints: `(workspace, code)`, `(workspace, short_name)`, `(workspace, dept_code)`
- StaffProfile has 2 workspace-scoped constraints: `(workspace, staff_id)`, `(workspace, user)`
- All constraints must drop `workspace` field and become globally unique
- `linked_project` FK becomes `linked_workspace` OneToOneField(nullable) -- prevents multiple departments mapping to same workspace
- Data migration must handle existing records: copy workspace from old FK before dropping column
- BaseModel already provides `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`

## Requirements

### Functional

- Department model: no workspace FK, no linked_project FK, new linked_workspace OneToOneField
- StaffProfile model: no workspace FK
- Unique constraints: instance-level (no workspace in compound keys)
- Data preserved during migration

### Non-functional

- Zero-downtime migration (additive first, then remove)
- Reversible migration (backward RunPython)

## Architecture

```
Department:
  - REMOVE: workspace FK
  - REMOVE: linked_project FK
  - ADD: linked_workspace = OneToOneField("db.Workspace", null=True, blank=True, on_delete=SET_NULL, related_name="linked_department")
  - UPDATE constraints: code, short_name, dept_code become globally unique

StaffProfile:
  - REMOVE: workspace FK
  - UPDATE constraints: staff_id, user become globally unique
```

## Related Code Files

### Files to Modify

- `apps/api/plane/db/models/department.py` -- remove workspace FK, remove linked_project FK, add linked_workspace, update Meta constraints
- `apps/api/plane/db/models/staff.py` -- remove workspace FK, update Meta constraints
- `apps/api/plane/db/models/__init__.py` -- verify exports (likely no change)

### Files to Create

- `apps/api/plane/db/migrations/XXXX_department_workspace_migration.py` -- Django migration with RunPython data migration

## Implementation Steps

1. **Create migration file** with multiple operations:
   a. Add `linked_workspace` OneToOneField(nullable) to Department
   b. RunPython: set `linked_workspace = None` for all departments (validated: admin will link manually post-migration)
   <!-- Updated: Validation Session 1 - all linked_workspace = null, no auto-mapping from old workspace -->

   d. Remove old unique constraints by name:
   - `department_unique_workspace_code`
   - `department_unique_workspace_short_name`
   - `department_unique_workspace_dept_code`
   - `staff_unique_workspace_staff_id`
   - `staff_unique_workspace_user`
     e. Remove `workspace` FK from Department
     f. Remove `linked_project` FK from Department
     g. Remove `workspace` FK from StaffProfile
     h. Add new unique constraints:
   - `department_unique_code` on `(code,)` with `deleted_at__isnull=True`
   - `department_unique_short_name` on `(short_name,)` with `deleted_at__isnull=True`
   - `department_unique_dept_code` on `(dept_code,)` with `deleted_at__isnull=True`
   - `staff_unique_staff_id` on `(staff_id,)` with `deleted_at__isnull=True`
   - `staff_unique_user` on `(user,)` with `deleted_at__isnull=True`

2. **Update Department model** (`department.py`):
   - Remove `workspace` field
   - Remove `linked_project` field
   - Add `linked_workspace` field
   - Update `select_related` references in `clean()` if any
   - Update Meta constraints to match new names

3. **Update StaffProfile model** (`staff.py`):
   - Remove `workspace` field
   - Update docstring (no longer "scoped to workspace")
   - Update Meta constraints

4. **Run `python manage.py makemigrations`** to verify model matches migration
5. **Run `python manage.py migrate`** on dev database
6. **Verify** no broken FK references

## Todo List

- [x]Write Django migration with RunPython data migration
- [x]Update Department model (remove workspace, linked_project; add linked_workspace)
- [x]Update StaffProfile model (remove workspace)
- [x]Update unique constraints (instance-level)
- [x]Test migration forward on dev DB
- [x]Test migration backward (reversible)
- [x]Verify no orphaned references

## Success Criteria

- `python manage.py migrate` runs without errors
- Department has no `workspace` or `linked_project` FK
- Department has `linked_workspace` OneToOneField(nullable)
- StaffProfile has no `workspace` FK
- All unique constraints are instance-scoped
- Existing data preserved (linked_workspace populated from linked_project's workspace)

## Risk Assessment

| Risk                                         | Impact                                   | Mitigation                                                          |
| -------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| Duplicate codes across workspaces            | Migration fails on new unique constraint | Pre-check query: find duplicates, resolve manually before migration |
| Data loss during FK removal                  | Lost workspace association               | RunPython copies data before dropping columns                       |
| OneToOne conflict (two depts same workspace) | Migration fails                          | linked_workspace is nullable; only set when dept had linked_project |

## Security Considerations

- No auth changes in this phase
- Migration runs as DB admin (standard Django migrate)

## Next Steps

- Phase 2: Backend API Migration (update views, serializers, URLs to use instance-level)
