# Phase 01 — Frontend Validation

## Context Links

- Plan: [plan.md](./plan.md)
- Form component: `apps/web/core/components/issues/issue-modal/components/default-properties.tsx`
- Dropdown types: `apps/web/core/components/dropdowns/types.d.ts`
- Dropdown buttons: `apps/web/core/components/dropdowns/buttons.tsx`
- Form root: `apps/web/core/components/issues/issue-modal/form.tsx`
- Title input (validation pattern ref): `apps/web/core/components/issues/issue-modal/components/title-input.tsx`

## Overview

- **Date:** 2026-03-03
- **Priority:** P2
- **Status:** complete
- **Description:** Add client-side required field validation to the work item creation form using React Hook Form patterns already established in the codebase. Required fields: **State, Assignee, Priority, Start date, Due date, Label** (6 fields). `estimate_time` and `module_ids` are NOT required.

## Key Insights

1. **Form uses React Hook Form + FormProvider**: `IssueFormRoot` wraps children in `FormProvider`, so `useFormContext<TIssue>()` is available in `IssueDefaultProperties`.
2. **Validation pattern**: `title-input.tsx` shows the established pattern — `Controller` with `rules={{ required: "..." }}`, `errors.fieldName` for error state, `hasError={Boolean(errors.fieldName)}` prop on inputs.
3. **Dropdowns lack `hasError` prop**: `TDropdownProps` in `types.d.ts` has no `hasError`. Need to add it and apply red border in `BorderButton` component.
4. **Priority "none" is valid default**: Requires `validate: (v) => v !== "none" || "Priority is required."` rule instead of plain `required`.
5. **`module_ids` NOT required**: Skipped per validation decision — it's post-create only (separate model).
6. **`estimate_time` NOT required**: Skipped per validation decision — removed from required fields.
7. **Form submission blocked automatically** by React Hook Form when `required` rules are not satisfied — no extra code needed.

<!-- Updated: Validation Session 1 - removed estimate_time and module_ids from required fields -->

## Requirements

### Functional

- Required fields: State, Assignee, Priority, Start date, Due date, Label (6 fields — all projects, no exceptions)
- Show red border on errored dropdown buttons
- Show error text below errored field
- Disable submit / show errors only after first submit attempt (`formState.isSubmitted`)

<!-- Updated: Validation Session 1 - reduced to 6 required fields, removed estimate_time and module_ids -->

### Non-functional

- No performance regression
- Follow existing RHF + Controller patterns exactly
- All error messages in English (i18n consideration: use `t()` if codebase already uses it)

## Architecture

```
IssueFormRoot (form.tsx)
  └─ FormProvider (React Hook Form)
       ├─ TitleInput (already has validation)
       └─ IssueDefaultProperties (default-properties.tsx)  ← MODIFY
            ├─ Controller(state_id, rules={required})
            │    └─ StateDropdown(hasError=...) + error text below
            ├─ Controller(assignee_ids, rules={validate: v.length > 0})
            │    └─ MemberDropdown(hasError=...) + error text below
            ├─ Controller(priority, rules={validate: !=none})
            │    └─ PriorityDropdown(hasError=...) + error text below
            ├─ Controller(start_date, rules={required})
            │    └─ DateDropdown(hasError=...) + error text below
            ├─ Controller(target_date, rules={required})
            │    └─ DateDropdown(hasError=...) + error text below
            └─ Controller(label_ids, rules={validate: v.length > 0})
                 └─ IssueLabelSelect(hasError=...) + error text below
```

<!-- Updated: Validation Session 1 - removed module_ids and estimate_time from architecture -->

## Related Code Files

**Modify:**

- `apps/web/core/components/dropdowns/types.d.ts` — add `hasError?: boolean` to `TDropdownProps`
- `apps/web/core/components/dropdowns/buttons.tsx` — apply `border-danger-primary` when `hasError`
- `apps/web/core/components/issues/issue-modal/components/default-properties.tsx` — add RHF rules + `hasError` props + inline error text

**Reference (do not modify):**

- `apps/web/core/components/issues/issue-modal/components/title-input.tsx` — validation pattern

## Implementation Steps

### Step 1 — Add `hasError` to `TDropdownProps`

File: `apps/web/core/components/dropdowns/types.d.ts`

Add `hasError?: boolean;` to the `TDropdownProps` type definition. This allows all dropdown components that extend `TDropdownProps` to accept the prop.

### Step 2 — Apply error border in `BorderButton`

File: `apps/web/core/components/dropdowns/buttons.tsx`

In `BorderButton` (the button variant used by all issue property dropdowns), conditionally apply `border-danger-primary` class when `hasError` is truthy:

```tsx
// In BorderButton component
<button
  className={cn(
    "flex items-center gap-1.5 border-[0.5px] rounded px-2 py-1 text-xs",
    hasError ? "border-danger-primary text-danger-primary" : "border-custom-border-300 text-custom-text-300",
    className
  )}
  ...
>
```

Also forward `hasError` to the button's wrapper `div` if applicable.

### Step 3 — Add validation to `IssueDefaultProperties`

File: `apps/web/core/components/issues/issue-modal/components/default-properties.tsx`

1. Import `useFormContext` and destructure `formState: { errors }` alongside existing `control`, `watch`, `setValue`
2. For each of the 6 required fields, add `rules` to the existing `Controller`:
   - `state_id`: `rules={{ required: "State is required." }}`
   - `assignee_ids`: `rules={{ validate: (v) => (v && v.length > 0) || "Assignee is required." }}`
   - `priority`: `rules={{ validate: (v) => v !== "none" || "Priority is required." }}`
   - `start_date`: `rules={{ required: "Start date is required." }}`
   - `target_date`: `rules={{ required: "Due date is required." }}`
   - `label_ids`: `rules={{ validate: (v) => (v && v.length > 0) || "Label is required." }}`
3. Pass `hasError={Boolean(errors.state_id)}` etc. to each dropdown
4. Add error `<span className="text-xs text-danger-primary mt-1">` below each dropdown

<!-- Updated: Validation Session 1 - removed module_ids and estimate_time steps -->

## Todo

- [ ] Add `hasError?: boolean` to `TDropdownProps`
- [ ] Apply error border in `BorderButton`
- [ ] Add RHF `rules` to `state_id` Controller
- [ ] Add RHF `rules` to `assignee_ids` Controller
- [ ] Add RHF `rules` to `priority` Controller (validate != "none")
- [ ] Add RHF `rules` to `start_date` Controller
- [ ] Add RHF `rules` to `target_date` Controller
- [ ] Add RHF `rules` to `label_ids` Controller
- [ ] Pass `hasError` props to all 6 dropdown components
- [ ] Add error text `<span>` below each errored dropdown
- [ ] Test: form blocks submit when fields empty
- [ ] Test: red borders + error text appear on errored fields

<!-- Updated: Validation Session 1 - removed module_ids, estimate_time, and error summary tasks -->

## Success Criteria

- Work item creation form blocks submission when any of the 6 required fields is empty
- Red border + error text appear on empty required fields after submit attempt
- Each dropdown shows error styling via `hasError` prop
- No regressions on non-required field interactions

## Risk Assessment

| Risk                                                               | Likelihood | Impact | Mitigation                                                 |
| ------------------------------------------------------------------ | ---------- | ------ | ---------------------------------------------------------- |
| `BorderButton` used by many dropdowns — styling change affects all | Medium     | Low    | Add `hasError` as opt-in, no visual change unless passed   |
| Priority "none" as valid value — breaking existing flows           | Low        | Medium | `validate` rule only applies on create form, not elsewhere |

## Security Considerations

- Frontend validation is UX only — no backend enforcement (Phase 2 skipped)
- No user input directly rendered as HTML — XSS not applicable here
- No auth/permission changes in this phase

## Next Steps

- After Phase 1 complete: run `pnpm build` in `apps/web` to verify no TypeScript errors
