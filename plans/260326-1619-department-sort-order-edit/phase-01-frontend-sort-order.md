---
parent: ./plan.md
---

# Phase 01 – Frontend: Add sort_order Field

## Overview

- **Date:** 2026-03-26
- **Priority:** P3
- **Status:** complete
- **Effort:** 30m

## Context

Backend fully ready. `sort_order` is a `FloatField(default=65535)` on the `Department` model, included in `DepartmentSerializer`, and accepted by the PATCH endpoint.

Admin panel (`apps/admin`) already has complete implementation — use as reference.

## Key Insights

- `sort_order` default is `65535` (allows inserting items before by using lower values)
- Float type — accept decimal inputs
- Backend orders tree by `sort_order ASC, name ASC`
- No validation needed server-side (any float accepted)

## Files to Change

| File                                                      | Change                                        |
| --------------------------------------------------------- | --------------------------------------------- |
| `apps/web/ce/services/department.service.ts`              | Add `sort_order?: number` to 3 interfaces     |
| HO edit/create form modal in `apps/web/ce/components/ho/` | Add `sort_order` to form data + edit populate |
| HO form fields component in `apps/web/ce/components/ho/`  | Add numeric Input for `sort_order`            |

> **Note:** Target is god-mode HO page only. Locate exact edit/create modal component under `apps/web/ce/components/ho/` before editing.

## Reference

Admin implementation (complete example):
`apps/admin/app/(all)/(dashboard)/departments/components/department-form-modal.tsx`

## Implementation Steps

### Step 1 — Update types in `department.service.ts`

Add `sort_order?: number` to:

- `IDepartment` interface
- `IDepartmentCreate` interface
- `IDepartmentUpdate` interface

### Step 2 — Update HO department form modal

1. Add to initial/default form data:
   ```ts
   sort_order: 65535,
   ```
2. In edit populate block, add:
   ```ts
   sort_order: department.sort_order ?? 65535,
   ```
   Applies to **both** Create (default 65535) and Edit (pre-populate from dept data).

### Step 3 — Add input in HO form fields component

Add a numeric `Input` field (integer only):

```tsx
<div className="flex flex-col gap-1">
  <label className="text-sm font-medium text-custom-text-200">Sort Order</label>
  <Input
    type="number"
    value={formData.sort_order}
    onChange={(e) => handleChange("sort_order", parseInt(e.target.value, 10) || 65535)}
    placeholder="65535"
    min={0}
    step={1}
  />
</div>
```

Use `@plane/propel` `Input` component (not `@plane/ui`).

## Success Criteria

- [x] Sort order field visible in Edit Department modal with current value pre-populated
- [x] Sort order field visible in Create Department modal with default `65535`
- [x] Saving updates the value via PATCH endpoint
- [x] Tree re-orders after save (reflects new sort_order)
- [x] `pnpm check:lint` passes with 0 errors

## Risk Assessment

- **Low risk** — purely additive frontend change, no backend changes
- Form modal may need `sort_order` added to the TypeScript type of `formData` state

## Validation Log

### Session 1 — 2026-03-26

1. **[Scope]** God-mode HO only (not workspace settings)
2. **[Create form]** Both Create + Edit (default 65535 pre-filled)
3. **[Input step]** Integer only (step=1)
