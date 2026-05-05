# Phase 01: Modules Required Validation

## Context Links

- Validation hook: `apps/web/ce/hooks/use-issue-form-validation.ts`
- Hook re-export: `apps/web/core/hooks/store/use-issue-form-validation.ts`
- Default properties (module Controller): `apps/web/core/components/issues/issue-modal/components/default-properties.tsx` (lines 235-257)
- Module store: `apps/web/core/store/module.store.ts` (`getProjectModuleIds`)
- Module hook: `apps/web/core/hooks/store/use-module.ts`
- Additional properties (pattern reference): `apps/web/ce/components/issues/issue-modal/modal-additional-properties.tsx`

## Overview

Extend existing validation infrastructure to make `module_ids` conditionally required. Two bypass conditions: draft state, or project has no modules.

## Requirements

1. `module_ids` must be non-empty on submit (at least one module selected) — **issue creation only, not edit**
2. Skip validation when selected state group is "backlog" (draft)
3. Skip validation when project has zero modules (`getProjectModuleIds` returns `null` or empty array — null treated as "no modules")
4. Show red outline on module dropdown when validation fails (same `outline-danger-strong` pattern used by other fields)
5. Clear module validation error immediately when state switches to draft (via useEffect, not deferred to next submit)

<!-- Updated: Validation Session 1 - Scope confirmed as create-only; null store = skip; error clears immediately on draft state change -->

## Architecture

```
useIssueFormValidation (CE hook)
  ├── watches state_id → determines isDraftState
  ├── NEW: accepts projectId param
  ├── NEW: reads getProjectModuleIds(projectId) from useModule()
  ├── NEW: exposes getModuleFieldRules() that returns {} when draft OR no modules
  └── getFieldRules() — existing, unchanged for other fields

default-properties.tsx (core)
  └── module_ids Controller
      ├── ADD: rules={getModuleFieldRules({ validate: ... })}
      └── ADD: error outline via errors.module_ids
```

### Option A (Recommended): Extend `useIssueFormValidation` with project-aware module rules

Add a `getModuleFieldRules` function alongside existing `getFieldRules`. It applies the same draft bypass PLUS the "no modules in project" bypass. This keeps concerns separated -- `getFieldRules` stays generic, `getModuleFieldRules` handles module-specific logic.

### Option B: Generic approach with extra param

Make `getFieldRules` accept a second `skip` boolean. Rejected -- violates KISS; other callers don't need this.

## Related Code Files

| File                                                                            | Change Type                                                  |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `apps/web/ce/hooks/use-issue-form-validation.ts`                                | Modify -- add `projectId` param, `getModuleFieldRules`       |
| `apps/web/core/components/issues/issue-modal/components/default-properties.tsx` | Modify -- add rules + error outline to module_ids Controller |

## Implementation Steps

### Step 1: Update `useIssueFormValidation` hook

File: `apps/web/ce/hooks/use-issue-form-validation.ts`

1. Add `projectId` parameter to hook (optional string, for backward compat)
2. Import `useModule` from `@/hooks/store/use-module`
3. Get `getProjectModuleIds` from module store
4. Add `getModuleFieldRules(originalRules)`:
   - If `isDraftState` OR `!projectId` OR `getProjectModuleIds(projectId)` is null/empty -> return cleared rules (same pattern as `getFieldRules` draft bypass)
   - Otherwise return `originalRules` as-is
5. Return `getModuleFieldRules` alongside existing exports
6. Also clear module errors in the existing `useEffect` when draft state changes

### Step 2: Update `default-properties.tsx` module Controller

File: `apps/web/core/components/issues/issue-modal/components/default-properties.tsx`

1. Destructure `getModuleFieldRules` from `useIssueFormValidation()` -- note: hook call already exists at line 81, just add to destructure
2. Pass `projectId` to `useIssueFormValidation(projectId)` (update the existing call)
3. Add `rules` prop to module_ids Controller (only when `!id` — create mode):
   ```
   rules={!id ? getModuleFieldRules({ validate: (v) => (v && v.length > 0) || t("module_is_required") }) : {}}
   ```
4. Add error outline to module dropdown wrapper div:
   ```
   className={cn("h-7 rounded-sm", errors.module_ids && "outline outline-1 outline-danger-strong")}
   ```

### Step 3: Add translation key

Add `module_is_required` to the i18n translation files (same location as existing `assignee_is_required`, `frequency_is_required`, etc.).

Search for where these keys are defined:

- Check `packages/i18n/` for the translation JSON files
- Add `"module_is_required": "Module is required"` alongside other validation messages

## Todo List

- [ ] Update `useIssueFormValidation` hook with `projectId` param and `getModuleFieldRules`
- [ ] Update `default-properties.tsx` module Controller with rules + error outline
- [ ] Add `module_is_required` translation key
- [ ] Run `pnpm check:lint` to verify no lint errors
- [ ] Manual test: create issue with no module selected (non-draft state, project has modules) -> should show error
- [ ] Manual test: switch to draft/backlog state -> error clears, submit succeeds without module
- [ ] Manual test: project with no modules -> no error, submit succeeds

## Success Criteria

- Module dropdown shows red outline when empty on submit (non-draft, project has modules)
- Switching to draft state clears module error and allows submit
- Projects with no modules skip validation entirely
- No regressions on existing field validations (assignee, frequency, dates)
- Lint passes

## Risk Assessment

| Risk                                                             | Likelihood | Mitigation                                                                                                  |
| ---------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| Hook signature change breaks other callers                       | Low        | `projectId` is optional param; `getFieldRules` unchanged                                                    |
| Module store not loaded when form renders                        | Low        | `getProjectModuleIds` returns null for unloaded -> treated as "no modules" = skip validation (safe default) |
| `module_ids` field not registered by RHF when module_view is off | None       | Controller only renders when `projectDetails?.module_view` is true; no Controller = no validation           |

## Security Considerations

Frontend-only validation -- no security impact. Backend should independently validate if modules are required (out of scope for this plan).

## Next Steps

- Consider adding backend validation for module requirement (separate plan)
- Consider making the "required fields" configurable per project in settings
