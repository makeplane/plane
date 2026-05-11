# Phase 01 — Backend Model + Migration

## Context Links

- Project models: `apps/api/plane/db/models/project.py`
- ProjectBaseModel reference: `apps/api/plane/db/models/base.py`
- Backend rules: `.claude/rules/plane-backend-architecture.md`

## Overview

Priority: P2 | Status: pending
Add `ProjectFieldPermission` model — single row per project storing 4 booleans.

## Key Insights

- One-to-one with `Project`; lazy-created on first read.
- All booleans default `False` (locked = admin-only).
- Use `ProjectBaseModel` (gives `workspace`, `project`, soft-delete, timestamps).
- Pattern mirrors existing project-scoped settings models.

## Requirements

- Functional: store 4 boolean toggles per project.
- Non-functional: soft-delete safe (UniqueConstraint on `project` with `deleted_at__isnull=True`).

## Architecture

```
Project 1 ─── 1 ProjectFieldPermission
                  allow_member_modify_completed_date: bool
                  allow_member_modify_target_date: bool
                  allow_member_modify_start_date: bool
                  allow_member_delete_work_item: bool
```

## Related Code Files

**Create**

- `apps/api/plane/db/models/project_field_permission.py` (<100 lines)

**Modify**

- `apps/api/plane/db/models/__init__.py` — register new model
- `apps/api/plane/db/migrations/XXXX_project_field_permission.py` — new migration (auto-generated)

## Implementation Steps

1. Inspect `ProjectBaseModel` — confirm it declares `project` FK. If yes, the model below relies on inherited FK and enforces uniqueness via `UniqueConstraint`. If no, declare `OneToOneField` explicitly.
2. Create `project_field_permission.py` with `class ProjectFieldPermission(ProjectBaseModel)`:
   - 4 `BooleanField(default=False)` columns (names above)
   - `Meta`: `db_table = "project_field_permissions"`, `UniqueConstraint(fields=["project"], condition=Q(deleted_at__isnull=True), name="project_field_permission_unique_project_when_undeleted")`, `verbose_name`
3. Register in `plane/db/models/__init__.py`.
4. `cd apps/api && python manage.py makemigrations` → commit migration.
5. Run migration locally; verify table exists.

## Todo List

- [ ] Confirm `ProjectBaseModel` FK shape
- [ ] Create model file
- [ ] Register in `__init__.py`
- [ ] Generate migration
- [ ] Run + verify table
- [ ] Run `python run_tests.py -u` to ensure no breakage

## Success Criteria

- Model importable: `from plane.db.models import ProjectFieldPermission`
- Migration applies cleanly + reversible
- Existing tests pass

## Risk Assessment

- **R:** Forgetting `deleted_at` condition on UniqueConstraint → duplicate-row crashes on soft delete. Mitigation: copy exact pattern from `WorkspaceUserProperties` / other soft-delete-safe models.
- **R:** Double-FK if base already declares `project`. Mitigation: use inherited FK + `UniqueConstraint` instead of redeclaring.

## Security Considerations

- None at model level; enforcement in Phase 02.

## Next Steps

- Phase 02 (API)
