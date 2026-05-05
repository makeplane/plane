# Phase 02: Frontend Changes

## Context Links

- [Scout Report](./reports/scout-report.md)
- [plan.md](./plan.md)
- [Phase 01: Backend](./phase-01-backend-changes.md)

## Overview

- **Priority**: P2
- **Status**: completed
- **Description**: Remove "none" from frontend priority constants, filters, form defaults, and analytics options. Change default to "medium". Keep `TIssuePriorities` type and `PriorityIcon` supporting "none" for backward compat with existing DB data.

## Key Insights

- `ISSUE_PRIORITIES` array in `packages/constants/src/issue/common.ts` is consumed by dropdowns, filters, sort, grouping columns across web + space apps
- `TIssuePriorities` type is defined in 3 places -- must keep "none" in type for backward compat
- `PriorityIcon` must keep "none" case to render existing issues
- Issue creation modal already validates `v !== "none"` -- that validation can be removed once "none" is no longer a selectable option
- CSS variables for "none" should be kept (no harm, used by PriorityIcon for existing data)
- The `SPREADSHEET_PROPERTY_DETAILS.priority.ascendingOrderTitle` currently says "None" -- update to "Low"

## Requirements

### Functional

- Remove "none" entry from `ISSUE_PRIORITIES` array (affects dropdowns, filters, sort, grouping)
- Remove "none" entry from `ISSUE_PRIORITY_FILTERS` array (affects filter panels)
- Remove "none" entry from `ANALYTICS_PRIORITY_OPTIONS` (affects custom dashboard filters)
- Change `DEFAULT_WORK_ITEM_FORM_VALUES.priority` from "none" to "medium"
- Change `createIssuePayload` default priority from "none" to "medium"
- Change inbox create modal default priority from "none" to "medium"
- Update `PriorityDropdown` default value from "none" to "medium"
- Remove the `v !== "none"` validation in issue modal (no longer needed)

### Non-functional

- Keep `TIssuePriorities` type including "none" for backward compat
- Keep `PriorityIcon` "none" case for rendering existing data
- Keep CSS variables for "none" priority styling

## Architecture

No architectural changes. Pure constant/default value updates.

## Related Code Files

### Files to Modify

| File                                                                            | Change                                                                                                                               |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/constants/src/issue/common.ts`                                        | Remove "none" entry from `ISSUE_PRIORITIES`; update `SPREADSHEET_PROPERTY_DETAILS.priority.ascendingOrderTitle` from "None" to "Low" |
| `packages/constants/src/issue/filter.ts`                                        | Remove "none" entry from `ISSUE_PRIORITY_FILTERS`                                                                                    |
| `packages/constants/src/issue/modal.ts`                                         | Change `DEFAULT_WORK_ITEM_FORM_VALUES.priority` to "medium"                                                                          |
| `packages/constants/src/custom-dashboard.ts`                                    | Remove "none" entry from `ANALYTICS_PRIORITY_OPTIONS`                                                                                |
| `packages/utils/src/work-item/base.ts`                                          | Change `createIssuePayload` default priority to "medium"                                                                             |
| `apps/web/core/components/dropdowns/priority.tsx`                               | Change default `value` from "none" to "medium"; update tooltip fallback text from "None" to "Medium"                                 |
| `apps/web/core/components/issues/issue-modal/components/default-properties.tsx` | Remove `v !== "none"` validation rule on priority field                                                                              |
| `apps/web/core/components/inbox/modals/create-modal/create-root.tsx`            | Change default priority from "none" to "medium"; change fallback from "none" to "medium"                                             |

### Files to Keep Unchanged (backward compat)

| File                                                                      | Reason                                                     |
| ------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `packages/types/src/issues.ts`                                            | `TIssuePriorities` type must keep "none" for existing data |
| `packages/constants/src/issue/common.ts`                                  | `TIssuePriorities` type alias must keep "none"             |
| `packages/propel/src/icons/priority-icon.tsx`                             | Must keep "none" icon (Ban) + styling for existing data    |
| `packages/tailwind-config/variables.css`                                  | CSS vars for "none" must remain                            |
| `apps/space/core/components/issues/issue-layouts/properties/priority.tsx` | "none" in priorityClasses kept for rendering existing data |
| `apps/space/core/components/issues/peek-overview/issue-properties.tsx`    | Fallback styling kept                                      |

## Embedded Rules

- YAGNI: do NOT remove "none" from types or icon components -- existing data needs it
- KISS: only remove "none" from user-facing selection lists and defaults
- DRY: `ISSUE_PRIORITIES` is the single source for dropdown/filter items; removing "none" there propagates everywhere
- Follow i18n patterns for any text changes
- Run `pnpm check:lint` after changes

## Implementation Steps

### Step 1: Update Shared Constants

**File**: `packages/constants/src/issue/common.ts`

1. Remove the `{ key: "none", title: "None" }` entry from `ISSUE_PRIORITIES` array (lines 87-90)
2. Update `SPREADSHEET_PROPERTY_DETAILS.priority.ascendingOrderTitle` from `"None"` to `"Low"` (line 299)

**File**: `packages/constants/src/issue/filter.ts`

3. Remove the `{ key: "none", ... }` entry from `ISSUE_PRIORITY_FILTERS` array (lines 92-96)

**File**: `packages/constants/src/issue/modal.ts`

4. Change `priority: "none"` to `priority: "medium"` (line 18)

**File**: `packages/constants/src/custom-dashboard.ts`

5. Remove `{ key: "none", label: "None" }` from `ANALYTICS_PRIORITY_OPTIONS` (line 125)

### Step 2: Update Utility Functions

**File**: `packages/utils/src/work-item/base.ts`

6. Change `priority: "none"` to `priority: "medium"` in `createIssuePayload` (line 151)

### Step 3: Update Web App Components

**File**: `apps/web/core/components/dropdowns/priority.tsx`

7. Change `value = "none"` to `value = "medium"` in `PriorityDropdown` props destructuring (line 341)
8. In `BorderButton`: change tooltip fallback from `t("common.none")` to `t("issue.priority.medium")` (line 85)
9. In `TransparentButton`: change tooltip fallback from `t("common.none")` to `t("issue.priority.medium")` (line 260)
10. Remove `priority !== "none"` and `priority === "none"` style conditions in `priority.tsx`. After data migration these are dead code; remove them and replace with generic null/undefined checks if still needed for placeholder styling.
<!-- Updated: Validation Session 3 - Remove dead code; 'none' never appears after migration -->

**File**: `apps/web/core/components/issues/issue-modal/components/default-properties.tsx`

11. Remove the `rules={{ validate: (v) => v !== "none" || (t("priority_is_required")) }}` from priority Controller (line 116). The validation is no longer needed since "none" won't be a selectable option.

**File**: `apps/web/core/components/inbox/modals/create-modal/create-root.tsx`

12. Change `priority: "none"` to `priority: "medium"` in default form values (line 51)
13. Change `priority: formData.priority || "none"` to `priority: formData.priority || "medium"` in payload (line 154)

## Todo List

- [x] Remove "none" from `ISSUE_PRIORITIES` in `common.ts`
- [x] Update spreadsheet ascending order title from "None" to "Low"
- [x] Remove "none" from `ISSUE_PRIORITY_FILTERS` in `filter.ts`
- [x] Change default in `DEFAULT_WORK_ITEM_FORM_VALUES` in `modal.ts`
- [x] Remove "none" from `ANALYTICS_PRIORITY_OPTIONS` in `custom-dashboard.ts`
- [x] Change default in `createIssuePayload` in `base.ts`
- [x] Update `PriorityDropdown` default value and tooltip fallbacks
- [x] Remove `v !== "none"` validation in `default-properties.tsx`
- [x] Update inbox create modal defaults in `create-root.tsx`
- [x] Run `pnpm check:lint` to verify no lint errors
- [x] Run `pnpm build` (or `pnpm dev`) to verify no build errors

## Post-Phase Checklist

- [x] `ISSUE_PRIORITIES` has exactly 4 entries: urgent, high, medium, low
- [x] `ISSUE_PRIORITY_FILTERS` has exactly 4 entries
- [x] `ANALYTICS_PRIORITY_OPTIONS` has exactly 4 entries
- [x] All form defaults use "medium" not "none"
- [x] `TIssuePriorities` type still includes "none" (backward compat)
- [x] `PriorityIcon` still renders "none" with Ban icon
- [x] No TypeScript compilation errors
- [x] No lint errors
- [x] Priority dropdowns show only 4 options
- [x] New issue creation defaults to "medium"

## Success Criteria

- Priority dropdowns in web app show: Urgent, High, Medium, Low (no None)
- Priority filters show 4 options only
- New issues/drafts created with "medium" as default
- Existing issues with "none" priority still display correctly with Ban icon
- Analytics charts/dashboards priority options exclude "none"
- No TS or lint errors

## Risk Assessment

| Risk                                  | Mitigation                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Existing "none" data causes TS errors | Keep "none" in `TIssuePriorities` type union                                                     |
| PriorityIcon crashes on "none"        | Keep "none" in icon map (Ban icon)                                                               |
| Sort order breaks without "none"      | `ISSUE_PRIORITIES` drives sort; removing entry just shortens sort array                          |
| Group-by columns miss "none" group    | Mitigated by Phase 1 data migration — no issues will have `priority="none"` after migration runs |

## Security Considerations

None -- UI-only changes, no permission/auth impact.

## Next Steps

After completing Phase 2:

1. Run full `pnpm check:lint` and `pnpm build` to verify
2. Test manually: create issue (should default to Medium), verify dropdowns
3. Check existing issues with "none" priority still display correctly
4. Mark plan as completed in `plan.md`
