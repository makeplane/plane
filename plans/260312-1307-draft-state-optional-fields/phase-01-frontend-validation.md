# Phase 01 — Frontend Validation Bypass for Draft States

## Context

<!-- Updated: Validation Session 2 - Scope expanded to both create & edit forms -->

- Plan: [plan.md](./plan.md)
- Branch: `ngoc-feat/workspaces`
- **Create form component:** `apps/web/core/components/issues/issue-modal/components/default-properties.tsx`
- **Edit form component:** `apps/web/core/components/issues/issue-detail/sidebar.tsx` — uses MobX direct mutations (no FormProvider, no Controller rules) → **no changes needed**
- Form root: `apps/web/core/components/issues/issue-modal/form.tsx`
- State type: `packages/types/src/state.ts` — `IState.group: TStateGroups`
- State groups: `"backlog" | "unstarted" | "started" | "completed" | "cancelled"`
- "Draft" in UI = state group `"backlog"` (see `packages/constants/src/state.ts` line 24)

## Overview

Currently, the workitem creation form enforces required-field validation via react-hook-form `rules` on three Controller fields:

- `assignee_ids` — validate function requiring length > 0
- `start_date` — `required: t("start_date_is_required")`
- `target_date` — `required: t("due_date_is_required")`

When user picks a state whose group is `"backlog"`, these rules should be disabled (fields become optional). Title remains the only required field (enforced separately in `IssueTitleInput`).

## Key Insights

1. **Backend already tolerates nulls** — `IssueCreateSerializer` has `required=False` for `state_id`, `assignee_ids`, `label_ids`, etc. The `Issue` model allows `null`/blank for `start_date`, `target_date`, and empty assignee list. No backend changes needed.
2. **State group is available** — `useProjectState().getStateById(stateId)` returns `IState` with `.group` field. The `state_id` is already watched via `watch("state_id")` (available from form context).
3. **CE provider `handlePropertyValuesValidation`** returns `true` in CE — no EE property validation to worry about for this change.
4. **Validation is inline** in `default-properties.tsx` via Controller `rules` prop — must modify this core file (no CE override path for inline rules).

## Requirements

<!-- Updated: Validation Session 1 - Field scope expanded to all required fields; CE hook architecture -->

- [ ] When selected state group is `"backlog"`, skip required validation on **all required fields** (assignee_ids, start_date, target_date, and any future required fields)
- [ ] When state group changes away from `"backlog"`, re-enable validation
- [ ] Title (`name`) always required regardless of state
- [ ] No visual change to form layout — fields still appear, just not enforced
- [ ] Error outlines on fields should not appear when draft state selected and fields empty
- [ ] Validation logic lives in CE hook — only hook call added to `default-properties.tsx` (core stays minimal)

## Architecture

<!-- Updated: Validation Session 1 - CE hook pattern instead of inline core modification -->

```
apps/web/ce/hooks/use-issue-form-validation.ts   ← new (CE)
  └─> useIssueFormValidation(stateId)
       ├─> isDraftState: boolean
       └─> getFieldRules(fieldName): RHF ValidationRules | {}

apps/web/core/hooks/store/use-issue-form-validation.ts   ← new (core shim)
  └─> re-exports from ce/ via useContext / direct import

apps/web/core/components/issues/issue-modal/components/default-properties.tsx   ← minimal change (core)
  └─> const { isDraftState, getFieldRules } = useIssueFormValidation(watch("state_id"))
       └─> Controller rules={getFieldRules("assignee_ids")}  ← instead of inline rules
```

State flow:

```
StateDropdown onChange
  └─> form setValue("state_id", newId)
       └─> useIssueFormValidation re-derives isDraftState
            └─> getFieldRules returns {} if isDraftState, else original rules
                 └─> clearErrors on draft transition (useEffect in hook)
```

No new stores, services, or context. CE hook + core shim.

## Related Code Files

<!-- Updated: Validation Session 1 - CE hook architecture -->
<!-- Updated: Validation Session 2 - Edit form added to scope -->
<!-- Updated: Validation Session 4 - Edit form removed (sidebar.tsx uses MobX, no RHF validation) -->

| File                                                                            | Role                                                 | Change                                                          |
| ------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------- |
| `apps/web/ce/hooks/use-issue-form-validation.ts`                                | **New** — CE hook with draft detection + field rules | Create (verify `ce/hooks/` dir exists)                          |
| `apps/web/core/hooks/store/use-issue-form-validation.ts`                        | **New** — Core shim re-exporting CE hook             | Create                                                          |
| `apps/web/core/components/issues/issue-modal/components/default-properties.tsx` | Create form field validation rules                   | Replace inline rules with `getFieldRules(field)` calls          |
| `apps/web/core/components/issues/issue-detail/sidebar.tsx`                      | Edit form                                            | **No change** — uses MobX direct mutations, no validation rules |
| `apps/web/core/components/issues/issue-modal/form.tsx`                          | Form root                                            | No structural change                                            |
| `packages/types/src/state.ts`                                                   | IState type                                          | No change needed — `group` field already present                |

## Implementation Steps

<!-- Updated: Validation Session 1 - CE hook architecture; all fields except title -->

### Step 1: Create CE hook `apps/web/ce/hooks/use-issue-form-validation.ts`

```typescript
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import type { TIssue } from "@plane/types";
import { useProjectState } from "@/hooks/store/use-project-state";

type FieldRules = Record<string, unknown>;

export const useIssueFormValidation = () => {
  const { watch, clearErrors } = useFormContext<TIssue>();
  const { getStateById } = useProjectState();

  const selectedStateId = watch("state_id");
  const selectedState = selectedStateId ? getStateById(selectedStateId) : undefined;
  const isDraftState = selectedState?.group === "backlog";

  useEffect(() => {
    if (isDraftState) {
      clearErrors(); // clear all errors when switching to draft
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDraftState]);

  const getFieldRules = (originalRules: FieldRules): FieldRules => (isDraftState ? {} : originalRules);

  return { isDraftState, getFieldRules };
};
```

### Step 2: Create core shim `apps/web/core/hooks/store/use-issue-form-validation.ts`

```typescript
export { useIssueFormValidation } from "@/plane-web/hooks/use-issue-form-validation";
```

### Step 3: Update `default-properties.tsx` — replace inline rules

Import the hook:

```typescript
import { useIssueFormValidation } from "@/hooks/store/use-issue-form-validation";
```

In component body:

```typescript
const { getFieldRules } = useIssueFormValidation();
```

Wrap each Controller's rules:

```diff
- rules={{ validate: (v) => (v && v.length > 0) || t("assignee_is_required") }}
+ rules={getFieldRules({ validate: (v) => (v && v.length > 0) || t("assignee_is_required") })}

- rules={{ required: t("start_date_is_required") }}
+ rules={getFieldRules({ required: t("start_date_is_required") })}

- rules={{ required: t("due_date_is_required") }}
+ rules={getFieldRules({ required: t("due_date_is_required") })}
```

This pattern auto-handles any additional required fields: just wrap their `rules` with `getFieldRules(...)`.

### Step 4: Verify lint & types

```bash
pnpm check:lint
```

## Todo

<!-- Updated: Validation Session 1 - CE hook architecture -->
<!-- Updated: Validation Session 2 - Edit form scope, directory check -->

- [ ] Step 0: Verify `apps/web/ce/hooks/` exists; create dir if not
- [ ] Step 1: Create `apps/web/ce/hooks/use-issue-form-validation.ts`
- [ ] Step 2: Create `apps/web/core/hooks/store/use-issue-form-validation.ts` (shim)
- [ ] Step 3: Update `default-properties.tsx` (create form) — import hook, wrap rules with `getFieldRules`
- [x] Step 4: Edit form (`sidebar.tsx`) confirmed — no FormProvider/RHF, no validation rules → no changes needed
- [ ] Step 5: Run `pnpm check:lint`
- [ ] Manual test: create workitem with Draft state, leave all fields empty (except title) — should succeed
- [x] Manual test: edit workitem with Draft state — edit form uses MobX (no validation), already works
- [ ] Manual test: switch from Draft to non-Draft state — validation re-enables, errors clear
- [ ] Manual test: create/edit workitem with non-Draft state — original validation intact

## Success Criteria

- Workitem creation with Draft (backlog group) state succeeds with only title filled
- Workitem creation with non-Draft state still requires assignee, start_date, target_date
- No visual regressions — form layout unchanged
- No backend changes required
- Lint passes

## Risk Assessment

| Risk                                              | Likelihood | Impact | Mitigation                                                                                                    |
| ------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| State data not loaded when form renders           | Low        | Medium | `getStateById` returns undefined → `isDraftState` defaults to false → validation stays enabled (safe default) |
| User switches state after filling fields          | Low        | None   | Filled values persist; only validation toggled                                                                |
| Core file modification (`default-properties.tsx`) | N/A        | Low    | Change is minimal (inline rules only); no structural changes                                                  |

## Security Considerations

- No new API endpoints
- Backend already accepts null/empty optional fields — no new attack surface
- Draft items still require title (non-empty name) — prevents empty record creation

## Next Steps

After Phase 1, verify backend tolerance (Phase 2): confirm the `Issue` model and `IssueCreateSerializer` handle null `start_date`, `target_date`, and empty `assignee_ids` gracefully in all downstream flows (activity logging, notifications, etc.).
