# Scout Report: Remove "None" Priority

**Date**: 2026-03-04
**Scope**: Full-stack removal of "none" from priority list, set "medium" as default

## Findings Summary

### Backend (apps/api/)

| File                                | What                                                                                | Line(s)          |
| ----------------------------------- | ----------------------------------------------------------------------------------- | ---------------- |
| `plane/db/models/issue.py`          | `Issue.PRIORITY_CHOICES` tuple includes "none"; `priority` field defaults to "none" | 105-110, 139-144 |
| `plane/db/models/issue.py`          | `IssueVersion.PRIORITY_CHOICES` tuple includes "none"; default "none"               | 669-675, 681-686 |
| `plane/db/models/draft.py`          | `DraftIssue.PRIORITY_CHOICES` tuple includes "none"; default "none"                 | 17-23, 50-54     |
| `plane/utils/order_queryset.py`     | `PRIORITY_ORDER` list includes "none"                                               | 8                |
| `plane/utils/grouper.py`            | Priority grouper returns list with "none"                                           | 191              |
| `plane/utils/analytics_plot.py`     | `sort_data` order list includes "none"                                              | 48               |
| `plane/utils/filters/converters.py` | `DEFAULT_VALID_CHOICES["priority"]` includes "none"                                 | 45               |
| `plane/utils/openapi/parameters.py` | OpenAPI doc mentions "none"                                                         | 338              |
| `plane/api/views/issue.py`          | `priority_order` list includes "none"                                               | 319              |
| `plane/api/serializers/intake.py`   | Intake serializer defaults to "none"                                                | 170              |
| `plane/api/views/intake.py`         | Intake view defaults to "none"                                                      | 163, 194         |
| `plane/space/views/intake.py`       | Space intake view validates "none" as valid                                         | 119-124          |
| `plane/space/utils/grouper.py`      | Space grouper returns "none"                                                        | 228              |
| `plane/app/views/workspace/user.py` | `priority_order` list includes "none"                                               | 414              |
| `plane/bgtasks/dummy_data_task.py`  | Dummy data generator uses "none"                                                    | 316              |

### Frontend Packages

| File                                          | What                                                                                     |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `packages/constants/src/issue/common.ts`      | `TIssuePriorities` type union includes "none"; `ISSUE_PRIORITIES` array has "none" entry |
| `packages/constants/src/issue/filter.ts`      | `ISSUE_PRIORITY_FILTERS` has "none" entry                                                |
| `packages/constants/src/issue/modal.ts`       | `DEFAULT_WORK_ITEM_FORM_VALUES.priority` = "none"                                        |
| `packages/constants/src/custom-dashboard.ts`  | `ANALYTICS_PRIORITY_OPTIONS` includes "none"                                             |
| `packages/types/src/issues.ts`                | `TIssuePriorities` type includes "none"                                                  |
| `packages/propel/src/icons/priority-icon.tsx` | `TIssuePriorities` type and icon map includes "none" (Ban icon)                          |
| `packages/utils/src/work-item/base.ts`        | `createIssuePayload` defaults priority to "none"                                         |

### Frontend Apps

| File                                                                                    | What                                                          |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `apps/web/core/components/dropdowns/priority.tsx`                                       | Dropdown renders all `ISSUE_PRIORITIES`, default value "none" |
| `apps/web/core/components/issues/issue-modal/components/default-properties.tsx`         | Already validates `v !== "none"` -- shows error if none       |
| `apps/web/core/components/inbox/modals/create-modal/create-root.tsx`                    | Default priority "none" in form                               |
| `apps/web/core/components/issues/issue-layouts/utils.tsx`                               | `getPriorityColumns` renders all priorities                   |
| `apps/web/core/components/power-k/ui/pages/context-based/work-item/priorities-menu.tsx` | Maps all ISSUE_PRIORITIES                                     |
| `apps/web/core/store/issue/helpers/base-issues-utils.ts`                                | Sort uses `ISSUE_PRIORITIES.map(i => i.key)`                  |
| `apps/web/core/store/issue/helpers/base-issues.store.ts`                                | Sort uses `ISSUE_PRIORITIES.map(i => i.key)`                  |
| `apps/space/core/components/issues/issue-layouts/utils.tsx`                             | `getPriorityColumns` uses ISSUE_PRIORITIES                    |
| `apps/space/core/components/issues/issue-layouts/properties/priority.tsx`               | Priority classes include "none"                               |
| `apps/space/core/components/issues/peek-overview/issue-properties.tsx`                  | Fallback to "none" styling                                    |

### CSS/Tailwind

| File                                     | What                                                                                      |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| `packages/tailwind-config/variables.css` | CSS vars: `--priority-none`, `--text-color-priority-none`, `--border-color-priority-none` |

## Key Observations

1. The issue creation modal already validates that priority cannot be "none" (line 116 of default-properties.tsx) -- this project has been moving toward making priority required.
2. `PriorityIcon` component uses `Ban` icon for "none" and falls back to "none" when priority is null/undefined.
3. No DB migration needed for existing data -- "none" values in DB can remain, just hidden from UI selection.
4. Keep CSS variables and PriorityIcon support for "none" so existing data with "none" priority still renders correctly.
5. The `TIssuePriorities` type is defined in TWO places: `packages/types/src/issues.ts` and `packages/constants/src/issue/common.ts` and `packages/propel/src/icons/priority-icon.tsx`.

## Unresolved Questions

1. Should existing issues with "none" priority be auto-migrated to "medium" via a Django migration, or keep as-is and just hide "none" from UI? (Plan assumes: keep as-is in DB, just remove from UI selection)
2. Should the PriorityIcon still render the Ban icon for issues that have "none" in the DB? (Plan assumes: yes, for backward compat)
