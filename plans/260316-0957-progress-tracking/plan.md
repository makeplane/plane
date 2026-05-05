---
title: "Progress Tracking Display Property"
description: "Add due-date-based progress badge to work item cards via Display Properties toggle"
status: completed
priority: P2
effort: 3h
branch: ngoc-feat/workspaces
tags: [display-properties, work-items, badge, due-date]
created: 2026-03-16
---

# Progress Tracking Display Property

## Summary

Add "Progress Tracking" as a toggleable display property for list and kanban views on the Work Items page. When enabled, renders a color-coded badge (Off Track / Due Today / At Risk / On Track) based on due date vs. today.

## Current State

The codebase already has partial support for `progress_tracking`:

- Type: `progress_tracking?: boolean` in `IIssueDisplayProperties` (`packages/types/src/view-props.ts:182`)
- Spreadsheet column: `SpreadsheetProgressTrackingColumn` (`apps/web/ce/components/issues/spreadsheet/columns/progress-tracking-column.tsx`)
- Constants: `SPREADSHEET_PROPERTY_LIST` and `SPREADSHEET_PROPERTY_DETAILS` include `progress_tracking` (`packages/constants/src/issue/common.ts:235,397`)
- Backend: Signals and migrations seed `progress_tracking: True` in default display properties
- i18n: `spreadsheet.columns.progress_tracking: "Progress Tracking"` (`packages/i18n/src/locales/en/translations.ts:3408`)

## What's Missing

1. **Not in list/kanban toggle**: `ISSUE_DISPLAY_PROPERTIES_KEYS` array (line 154) and `ISSUE_DISPLAY_PROPERTIES` array (line 182) in `packages/constants/src/issue/common.ts` do NOT include `progress_tracking`
2. **No badge component for list/kanban**: The spreadsheet column component is tightly coupled to spreadsheet Row layout; need a reusable badge for card/list views
3. **Not rendered in all-properties.tsx**: The `WorkItemLayoutAdditionalProperties` CE component (or `all-properties.tsx`) does not render a progress tracking badge

## Architecture

```
packages/constants/src/issue/common.ts
  - Add "progress_tracking" to ISSUE_DISPLAY_PROPERTIES_KEYS
  - Add entry to ISSUE_DISPLAY_PROPERTIES

apps/web/ce/components/issues/issue-layouts/progress-tracking-badge.tsx  (NEW)
  - Reusable pure component: takes target_date, returns badge or null
  - Extract logic from existing SpreadsheetProgressTrackingColumn

apps/web/ce/components/issues/issue-layouts/additional-properties.tsx  (MODIFY)
  - Import ProgressTrackingBadge
  - Render via WithDisplayPropertiesHOC when displayProperties.progress_tracking is true
```

## Phase Breakdown

| Phase | Scope                           | Effort |
| ----- | ------------------------------- | ------ |
| 1     | Constants + Toggle Registration | 30min  |
| 2     | Badge Component                 | 1h     |
| 3     | View Integration (list/kanban)  | 1.5h   |

## Files to Modify

| File                                                                             | Action                                                          |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `packages/constants/src/issue/common.ts`                                         | Add to ISSUE_DISPLAY_PROPERTIES_KEYS + ISSUE_DISPLAY_PROPERTIES |
| `apps/web/ce/components/issues/issue-layouts/progress-tracking-badge.tsx`        | CREATE - reusable badge component                               |
| `apps/web/ce/components/issues/issue-layouts/additional-properties.tsx`          | MODIFY - render badge with WithDisplayPropertiesHOC             |
| `apps/web/ce/components/issues/spreadsheet/columns/progress-tracking-column.tsx` | MODIFY - extract shared logic to badge component                |

## Constraints

- CE pattern: new code in `apps/web/ce/`, never modify `apps/web/core/` (except render hooks in `core/hooks/store/`)
- Types already exist - no changes needed in `packages/types/`
- No backend changes needed - `target_date` already available on TIssue
- YAGNI: reuse existing `getProgressStatus` logic from spreadsheet column
- KISS: badge is a pure presentation component, no store interaction
- DRY: extract shared status logic into the badge, import from spreadsheet column

## Unresolved Questions

None - all patterns are well-established in the codebase.

## Validation Log

### Session 1 — 2026-03-16

**Trigger:** Initial plan validation before coding begins
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Phase 2 notes uncertainty on color tokens. Should the badge use design system tokens (text-status-red/amber/green) consistent with the spreadsheet column, or standard Tailwind colors (text-red-700 etc.)?
   - Options: Design system tokens (Recommended) | Standard Tailwind
   - **Answer:** Design system tokens (Recommended)
   - **Rationale:** Use `text-status-red`, `text-status-amber`, `text-status-green` and investigate `bg-status-*` variants — matches spreadsheet column, dark mode safe, consistent with design system.

2. **[Assumptions]** The plan defines 'At Risk' as exactly duedate = today+1. Should it be a range (e.g., due within 3 days = At Risk)?
   - Options: Exactly today+1 only | Within 3 days (Recommended) | Check spreadsheet column first
   - **Answer:** Exactly today+1 only
   - **Rationale:** Badge logic is: overdue/today = red, today+1 = amber, beyond = green. No range expansion needed.

3. **[Assumptions]** The backend seeds progress_tracking: True by default, so existing/new users will see the badge enabled immediately. Is that the intended behavior?
   - Options: Yes, enabled by default (Recommended) | No, default to off
   - **Answer:** Yes, enabled by default (Recommended)
   - **Rationale:** No backend changes needed; users control visibility via Display Properties toggle.

#### Confirmed Decisions

- Color tokens: use `text-status-*` design tokens (not raw Tailwind) — matches spreadsheet column, dark mode safe
- At Risk window: exactly today+1 only — no range
- Default enabled: yes, consistent with backend seed

#### Action Items

- [ ] Phase 2: use `text-status-red/amber/green` and investigate `bg-status-*` or equivalent for backgrounds

#### Impact on Phases

- Phase 2: Update badge color classes — use design system tokens (`text-status-*`), not raw Tailwind (`text-red-700`). Investigate `bg-status-*` for backgrounds; fall back to `bg-red-100/60` only if tokens don't exist.
