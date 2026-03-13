# Phase 1: Backend — Model + Serializer + Migration

## Context Links

- [Plan Overview](../plan.md)
- Related model: `apps/api/plane/db/models/department.py`
- Related serializer: `apps/api/plane/app/serializers/department.py`
- Migration reference: `apps/api/plane/db/migrations/0139_department_optional_code.py`

## Overview

- **Priority**: P2
- **Status**: complete
- **Effort**: 20m
- **Description**: Add `dept_type` CharField with TextChoices (HO/BRX/OSR) to the Department model; expose it in both DepartmentSerializer and DepartmentTreeSerializer; generate a Django migration.

## Key Insights

- Department model is at `apps/api/plane/db/models/department.py` — no `dept_type` field currently exists.
- Latest migration is `0139_department_optional_code.py`; the new one will be `0140_department_dept_type.py`.
- Both `DepartmentSerializer` (CRUD) and `DepartmentTreeSerializer` (read-only tree) need `dept_type` in `fields`.
- Field should be `blank=True` so existing rows are unaffected (empty string = "not set").
- No unique constraint needed; no `clean()` validation needed for this field.

## Requirements

- `dept_type` CharField, max_length=3, choices: `("HO","HO"), ("BRX","BRX"), ("OSR","OSR")`, blank=True, default=""
- Add after `description` field (line 21) for logical grouping
- Both serializers expose `dept_type` as writable
- Django migration generated via `python manage.py makemigrations`

## Architecture

```
Department model
  └── dept_type: CharField(max_length=3, choices=DEPT_TYPE_CHOICES, blank=True, default="")

DepartmentSerializer.fields  → add "dept_type"
DepartmentTreeSerializer.fields → add "dept_type"

Migration 0140: AddField(model_name="department", name="dept_type", ...)
```

## Related Code Files

- **Modify**: `apps/api/plane/db/models/department.py`
- **Modify**: `apps/api/plane/app/serializers/department.py`
- **Create**: `apps/api/plane/db/migrations/0140_department_dept_type.py` (via makemigrations)

## Embedded Rules

```
- BaseModel inheritance already handled — no changes needed there
- Use TextChoices or plain tuple choices — plain tuples are fine and consistent with existing pattern
- blank=True + default="" means existing rows get empty string (no NULL, no data migration needed)
- Run: cd apps/api && python manage.py makemigrations
- Register nothing extra — models/__init__.py already imports Department
```

## Implementation Steps

1. **Add DEPT_TYPE_CHOICES and dept_type field to model**
   - In `apps/api/plane/db/models/department.py`, after the `description` field (line 21), add:
     ```python
     DEPT_TYPE_CHOICES = [("HO", "HO"), ("BRX", "BRX"), ("OSR", "OSR")]
     dept_type = models.CharField(max_length=3, choices=DEPT_TYPE_CHOICES, blank=True, default="")
     ```
   - Place `DEPT_TYPE_CHOICES` as a class-level constant before the fields, or inline.

2. **Add dept_type to DepartmentSerializer fields list**
   - In `apps/api/plane/app/serializers/department.py`, inside `DepartmentSerializer.Meta.fields`, add `"dept_type"` after `"description"` (line 26).

3. **Add dept_type to DepartmentTreeSerializer fields list**
   - In the same file, inside `DepartmentTreeSerializer.Meta.fields`, add `"dept_type"` after `"description"` (line 72).

4. **Generate migration**
   - Run: `cd apps/api && python manage.py makemigrations`
   - Verify output creates `0140_department_dept_type.py` with `AddField` for `dept_type`.

## Post-Phase Checklist

- [x] Model compiles without errors (`python manage.py check`)
- [x] Migration file `0140_department_dept_type.py` generated and dependencies correct (`0139_department_optional_code`)
- [x] Both serializers include `dept_type` in fields list
- [x] No existing data migration needed (blank=True, default="")

## Todo List

- [x] Add DEPT_TYPE_CHOICES + dept_type field to department.py
- [x] Add dept_type to DepartmentSerializer.Meta.fields
- [x] Add dept_type to DepartmentTreeSerializer.Meta.fields
- [x] Run makemigrations and verify 0140 file
- [x] Run post-phase checklist

## Success Criteria

- `python manage.py check` passes with no errors
- Migration `0140_department_dept_type.py` exists with correct `AddField` operation
- GET `/api/instances/departments/` response includes `dept_type` field
- PATCH with `{"dept_type": "BRX"}` persists correctly

## Risk Assessment

- **Low risk** — additive-only change, no constraints, blank allowed
- Existing rows default to `""` — no data loss
- If `makemigrations` detects no changes, verify `dept_type` is actually saved in model file

## Security Considerations

- Input is constrained to 3-char choices; Django/DRF validates choices automatically on serializer
- No special permission needed — field follows existing Department endpoint auth

## Next Steps

- Phase 2 (frontend) can begin once this migration is applied locally
- No API version bump required — existing clients ignore unknown fields
