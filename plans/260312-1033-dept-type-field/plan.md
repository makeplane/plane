---
title: "Add Dept Type Field to Department Model"
description: "Add dept_type CharField (HO/BRX/OSR) to Department and expose in god-mode form"
status: complete
priority: P2
effort: 1h
branch: triho
tags: [backend, frontend, department, god-mode]
created: 2026-03-12
---

# Add Dept Type Field to Department Model

Add `dept_type` CharField with choices HO / BRX / OSR to the Department model. Expose it as a native `<select>` in the god-mode department form modal only. No HO workspace changes.

## Phases

| #   | Phase                                    | Status   | File                                           |
| --- | ---------------------------------------- | -------- | ---------------------------------------------- |
| 1   | Backend — model + serializer + migration | complete | [phase-01-backend.md](./phase-01-backend.md)   |
| 2   | Frontend — types + form                  | complete | [phase-02-frontend.md](./phase-02-frontend.md) |

## Files Modified

### Phase 1 — Backend

- `apps/api/plane/db/models/department.py` — add DEPT_TYPE_CHOICES + dept_type field
- `apps/api/plane/app/serializers/department.py` — add dept_type to both serializer field lists
- `apps/api/plane/db/migrations/0140_department_dept_type.py` — new migration (auto-generated)

### Phase 2 — Frontend

- `packages/services/src/department/instance-department.service.ts` — add DeptType + dept_type to IInstanceDepartment
- `apps/admin/app/(all)/(dashboard)/departments/components/department-form-modal.tsx` — add dept_type field to FormValues, defaultValues, reset, payload, and render select

## Success Criteria

- `dept_type` persists in DB with HO/BRX/OSR constraint
- God-mode form shows select with 3 options; defaults to HO on create
- Existing departments without dept_type receive blank/null (no data loss)
- No HO workspace or CE sidebar changes
