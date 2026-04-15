---
title: "Add sort_order field to Edit Department form"
description: "Expose sort_order numeric input in Create/Edit Department modal for workspace settings"
status: complete
priority: P3
effort: 30m
branch: triho
tags: [frontend, department, form, sort-order]
created: 2026-03-26
---

# Add sort_order to Department Form

## Summary

Backend already fully supports `sort_order` (FloatField, default 65535) in model, serializer, and PATCH endpoint. Only frontend changes needed.

## Phases

| #   | Phase                                                               | Status   | Effort |
| --- | ------------------------------------------------------------------- | -------- | ------ |
| 1   | [Frontend: Add sort_order field](./phase-01-frontend-sort-order.md) | complete | 30m    |

## Scope

**In scope:**

- Add `sort_order` to `IDepartment`, `IDepartmentCreate`, `IDepartmentUpdate` interfaces in `department.service.ts`
- Add `sort_order` to the **god-mode HO** department edit/create form (`apps/web/ce/components/ho/`)
- Integer input (step=1), shown in both Create and Edit flows
- Default value: 65535

**Out of scope:**

- Backend changes (already done)
- Workspace settings `/settings/departments/` form (not requested)
- Drag-and-drop reordering UI
- `is_active` / `dept_type` fields (separate task)

## Validation Log

### Session 1 — 2026-03-26

**Trigger:** Initial plan validation before implementation
**Questions asked:** 3

#### Confirmed Decisions

- **Scope:** God-mode HO page only (`/ho/`), not workspace settings
- **Forms:** Both Create and Edit forms (Create defaults to 65535)
- **Input step:** Integer only (step=1)

#### Action Items

- [x] Updated phase-01 to target `apps/web/ce/components/ho/` instead of settings components
- [x] Changed `parseFloat` → `parseInt` in input handler
