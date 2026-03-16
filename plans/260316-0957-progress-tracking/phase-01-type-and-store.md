# Phase 1: Constants + Toggle Registration

## Context

- Plan: `plans/260316-0957-progress-tracking/plan.md`
- Phase 1 of 3

## Overview

Register `progress_tracking` in the list/kanban display property toggle arrays so users can enable/disable it from the Display button panel.

## Key Insights

- `progress_tracking` already exists in `IIssueDisplayProperties` type - no type changes needed
- `ISSUE_DISPLAY_PROPERTIES_KEYS` controls which properties appear in list/kanban layout configs
- `ISSUE_DISPLAY_PROPERTIES` controls the toggle buttons in `FilterDisplayProperties` component
- The toggle rendering is automatic once the key + label are added to these arrays
- i18n key `spreadsheet.columns.progress_tracking` already exists

## Requirements

1. Add `"progress_tracking"` to `ISSUE_DISPLAY_PROPERTIES_KEYS`
2. Add entry to `ISSUE_DISPLAY_PROPERTIES` with i18n key

## Architecture

No new files. Single file modification.

```
packages/constants/src/issue/common.ts
  ISSUE_DISPLAY_PROPERTIES_KEYS: [..., "progress_tracking"]
  ISSUE_DISPLAY_PROPERTIES: [..., { key: "progress_tracking", titleTranslationKey: "spreadsheet.columns.progress_tracking" }]
```

## Related Code Files

| File                                                                                                  | Role                                                                                |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `packages/constants/src/issue/common.ts:154-171`                                                      | `ISSUE_DISPLAY_PROPERTIES_KEYS` array                                               |
| `packages/constants/src/issue/common.ts:182-223`                                                      | `ISSUE_DISPLAY_PROPERTIES` array                                                    |
| `packages/constants/src/issue/filter.ts:200-272`                                                      | `ISSUE_DISPLAY_FILTERS_BY_PAGE.issues` - references `ISSUE_DISPLAY_PROPERTIES_KEYS` |
| `apps/web/core/components/issues/issue-layouts/filters/header/display-filters/display-properties.tsx` | Renders toggle buttons from `ISSUE_DISPLAY_PROPERTIES`                              |
| `packages/i18n/src/locales/en/translations.ts:3408`                                                   | Existing i18n key                                                                   |

## Implementation Steps

1. Open `packages/constants/src/issue/common.ts`
2. Add `"progress_tracking"` at end of `ISSUE_DISPLAY_PROPERTIES_KEYS` array (before closing bracket)
3. Add object `{ key: "progress_tracking", titleTranslationKey: "spreadsheet.columns.progress_tracking" }` at end of `ISSUE_DISPLAY_PROPERTIES` array
4. Run `pnpm check:lint` to verify

## Todo

- [x] Add `progress_tracking` to `ISSUE_DISPLAY_PROPERTIES_KEYS`
- [x] Add `progress_tracking` to `ISSUE_DISPLAY_PROPERTIES`
- [x] Verify lint passes

## Success Criteria

- "Progress Tracking" toggle button appears in Display Properties panel for list/kanban layouts
- Toggle can be clicked on/off without errors
- No lint errors

## Risk Assessment

- **Low**: Additive change to existing arrays, no breaking changes
- The property already exists in backend defaults (seeded as `true`), so existing users will see it enabled by default

## Security Considerations

None - purely UI toggle registration.

## Next Steps

Phase 2: Create the `ProgressTrackingBadge` component.
