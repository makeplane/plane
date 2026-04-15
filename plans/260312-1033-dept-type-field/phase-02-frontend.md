# Phase 2: Frontend — Types + Form

## Context Links

- [Plan Overview](../plan.md)
- [Phase 1 — Backend](./phase-01-backend.md) (must complete first)
- Service types: `packages/services/src/department/instance-department.service.ts`
- Form modal: `apps/admin/app/(all)/(dashboard)/departments/components/department-form-modal.tsx`

## Overview

- **Priority**: P2
- **Status**: complete
- **Effort**: 20m
- **Description**: Add `DeptType` union type and `dept_type` field to `IInstanceDepartment`; update the god-mode department form to include a native `<select>` for dept_type in the 2-column grid, defaulting to `"HO"` on create.

## Key Insights

- `IInstanceDepartmentCreate` is derived via `Omit<IInstanceDepartment, ...>` — adding `dept_type` to `IInstanceDepartment` automatically makes it available in `IInstanceDepartmentCreate`.
- The form uses `react-hook-form` with `FormValues` typed locally; `dept_type` must be added there too.
- Two `reset()` calls exist: one for edit mode (line 57) and one for create mode (line 70) — both need `dept_type`.
- The `payload` object spread (`...data`) at line 78 will include `dept_type` automatically once it's in `FormValues` and registered.
- The parent `<select>` (line 127) uses the same native select pattern — reuse it for dept_type.
- Component is 150 lines — adding ~10 lines keeps it under the 150-line component limit.

## Requirements

- `DeptType = "HO" | "BRX" | "OSR"` exported type
- `dept_type: DeptType` in `IInstanceDepartment` (non-optional, consistent with other string fields)
- `dept_type: DeptType` in `FormValues`
- Default value for create: `"HO"`
- Select renders inside the 2-column grid after the dept_code field or after the parent select
- Label: "Dept Type"
- No i18n required (god-mode admin only)

## Architecture

```
IInstanceDepartment
  └── dept_type: DeptType  ("HO" | "BRX" | "OSR")

FormValues
  └── dept_type: DeptType

DepartmentFormModal
  └── <select {...register("dept_type")}>
        <option value="HO">HO</option>
        <option value="BRX">BRX</option>
        <option value="OSR">OSR</option>
      </select>
```

## Related Code Files

- **Modify**: `packages/services/src/department/instance-department.service.ts`
- **Modify**: `apps/admin/app/(all)/(dashboard)/departments/components/department-form-modal.tsx`

## Embedded Rules

```
- @plane/propel/* imports preferred over @plane/ui
- observer() already on DepartmentFormModal — keep it
- No i18n needed (admin-only god-mode form)
- Component must stay under 150 lines — adding ~10 lines is safe (currently 150 lines exactly)
  → Consider extracting DEPT_TYPE_OPTIONS const outside component to keep JSX clean
- Native <select> pattern already used for "parent" — follow the same className
- Payload spread (...data) already includes new fields if registered — no manual add needed
```

## Implementation Steps

1. **Add DeptType and update IInstanceDepartment**
   - In `packages/services/src/department/instance-department.service.ts` (line 10):
     - Add before `IInstanceDepartment`: `export type DeptType = "HO" | "BRX" | "OSR";`
     - Add `dept_type: DeptType;` to `IInstanceDepartment` after `dept_code` (line 15)
   - `IInstanceDepartmentCreate` inherits it automatically via `Omit`

2. **Update FormValues in DepartmentFormModal**
   - In `apps/admin/app/(all)/(dashboard)/departments/components/department-form-modal.tsx`:
   - Import `DeptType` from `@plane/services`
   - Add `dept_type: DeptType;` to `FormValues` type (after `dept_code`, line 21)

3. **Update defaultValues**
   - In the `useForm` call `defaultValues` object (line 41): add `dept_type: "HO" as DeptType`
   - In the create-mode `reset()` call (line 70): add `dept_type: "HO" as DeptType`

4. **Update edit-mode reset**
   - In the edit-mode `reset()` call (line 57): add `dept_type: editDept.dept_type`

5. **Add select field to form JSX**
   - After the dept_code field block (line 123), inside the 2-column grid, add:
     ```tsx
     <div className="space-y-1">
       <label className="text-13 font-medium">Dept Type</label>
       <select
         {...register("dept_type")}
         className="w-full rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13"
       >
         <option value="HO">HO</option>
         <option value="BRX">BRX</option>
         <option value="OSR">OSR</option>
       </select>
     </div>
     ```

6. **Verify payload**
   - The `payload` at line 77 uses `...data` spread — `dept_type` is included automatically.
   - No manual `dept_type: data.dept_type` addition needed.

## Post-Phase Checklist

- [x] `DeptType` exported from service file
- [x] `IInstanceDepartment.dept_type` typed as `DeptType`
- [x] `FormValues.dept_type` added and typed
- [x] Both `reset()` calls include `dept_type`
- [x] Select renders in 2-col grid with correct className matching parent select
- [x] Component stays ≤150 lines (or extract DEPT_TYPE_OPTIONS const if over)
- [x] TypeScript compiles without errors (`pnpm check:lint` in apps/admin)

## Todo List

- [x] Add DeptType type to instance-department.service.ts
- [x] Add dept_type to IInstanceDepartment interface
- [x] Import DeptType in department-form-modal.tsx
- [x] Add dept_type to FormValues
- [x] Update useForm defaultValues
- [x] Update create-mode reset()
- [x] Update edit-mode reset()
- [x] Add <select> element in JSX grid
- [x] Verify component line count ≤150
- [x] Run post-phase checklist

## Success Criteria

- Create form shows Dept Type select with HO pre-selected
- Edit form shows current dept_type value selected
- Save sends correct dept_type in PATCH/POST payload
- TypeScript has no type errors on the form file

## Risk Assessment

- **Low risk** — additive, no logic changes
- **Line count**: component is currently exactly 150 lines; adding ~10 lines requires extracting a small const outside the component
- **Type compatibility**: `IInstanceDepartmentCreate` via `Omit` inherits `dept_type` automatically — verify the Omit list doesn't exclude it

## Security Considerations

- Input constrained to enum values by TypeScript type + backend choices validation
- God-mode admin only — no additional auth concern beyond existing form security

## Next Steps

- After both phases: manually test create + edit via god-mode UI
- Verify existing departments render correctly with empty dept_type (no crash)
- No further phases required for this feature
