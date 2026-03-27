# Phase 02: Frontend Types & Constants

## Overview

Register `main_task_category` and `sub_task_category` as display property keys throughout the constants and type system. Add translations. Update the column ordering.

**Priority:** High | **Status:** Not Started

## Requirements

- Add `main_task_category` and `sub_task_category` to the `IIssueDisplayProperties` interface.
- **Verify first** — grep `TIssue` for `main_task_category_name`/`sub_task_category_name`; add to `TIssue` only if missing. <!-- Updated: Validation Session 1 - check before add -->
- Register both in `ISSUE_DISPLAY_PROPERTIES_KEYS`, `ISSUE_DISPLAY_PROPERTIES`, `SPREADSHEET_PROPERTY_LIST`, and `SPREADSHEET_PROPERTY_DETAILS`.
- Both keys must have **`defaultValue: true`** (or equivalent enabled-by-default config) in `ISSUE_DISPLAY_PROPERTIES`. <!-- Updated: Validation Session 1 - ON by default -->
- Both keys must be marked **sortable: true** in `SPREADSHEET_PROPERTY_DETAILS`; wire into filter constants. <!-- Updated: Validation Session 1 - sortable + filterable -->
- Update `SPREADSHEET_PROPERTY_LIST` ordering: `department_name` → `project_name` → `main_task_category` → `sub_task_category` → remaining columns.
- Add i18n translation keys for en, ko, vi.

## Related Code Files

- Files to modify:
  - `packages/types/src/view-props.ts` — `IIssueDisplayProperties` interface (~line 170)
  - `packages/types/src/issues/issue.ts` — `TIssue` type (~line 107)
  - `packages/constants/src/issue/common.ts` — All 4 config arrays
  - `packages/i18n/src/locales/en/translations.ts` — Add translation keys
  - `packages/i18n/src/locales/ko/translations.ts` — Add translation keys
  - `packages/i18n/src/locales/vi/translations.ts` — Add translation keys

## Embedded Rules

1. **Rule (Design System):** Always use `t()` for all user-facing strings — `.agent/rules/plane-design-system.md` Rule #6.
2. **Rule (i18n):** Translation files are `.ts` modules, not JSON — `AGENTS.md`.
3. **Rule (Color Tokens):** Semantic tokens only — `.agent/rules/color-tokens.md`.

## Implementation Steps

1. In `packages/types/src/view-props.ts`, add to `IIssueDisplayProperties`:

   ```typescript
   main_task_category?: boolean;
   sub_task_category?: boolean;
   ```

2. In `packages/types/src/issues/issue.ts`, add to `TIssue` (after `total_logged_minutes`):

   ```typescript
   main_task_category_name?: string | null;
   sub_task_category_name?: string | null;
   ```

3. In `packages/constants/src/issue/common.ts`:
   - Add to `ISSUE_DISPLAY_PROPERTIES_KEYS` (after `bank_wide_project`)
   - Add to `ISSUE_DISPLAY_PROPERTIES` with translation keys and **`defaultValue: true`** so both are ON by default <!-- Updated: Validation Session 1+2 - ON by default -->
   - Update `SPREADSHEET_PROPERTY_LIST` with new ordering:
     ```
     department_name → project_name → main_task_category → sub_task_category → project_lead → ...
     ```
   - Add to `SPREADSHEET_PROPERTY_DETAILS` with **`sortable: true`** and filter config using category ID dropdown (reuse task-category service) <!-- Updated: Validation Session 2 - sortable + category ID filter -->

4. Add translations in all 3 locale files under `spreadsheet.columns.main_task_category` and `spreadsheet.columns.sub_task_category`.

## Post-Phase Checklist

- [ ] No TypeScript compilation errors
- [ ] `IIssueDisplayProperties` has both new keys
- [ ] `SPREADSHEET_PROPERTY_LIST` has correct ordering
- [ ] `SPREADSHEET_PROPERTY_DETAILS` has entries for both
- [ ] Translation keys exist in en, ko, vi

## Success Criteria

- Both properties are registered and the build passes without type errors.
