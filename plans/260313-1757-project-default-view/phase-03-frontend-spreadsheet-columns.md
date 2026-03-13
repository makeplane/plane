# Phase 3: Frontend -- New Spreadsheet Columns (Project Scope)

## Context

- Column components (CE, workspace): `apps/web/ce/components/issues/spreadsheet/columns/`
- CE column map: `apps/web/ce/components/issues/issue-layouts/utils.tsx` (`SPREADSHEET_COLUMNS`)
- Type: `IIssueDisplayProperties` in `packages/types/src/view-props.ts`
- Constants: `SPREADSHEET_PROPERTY_LIST` + `SPREADSHEET_PROPERTY_DETAILS` in `packages/constants/src/issue/common.ts`
- Column signature: `TSpreadsheetColumn` = `FC<{issue, onClose, onChange, disabled}>`
- **Workspace plan already created**: `bank-wide-project-column.tsx`, `progress-tracking-column.tsx`, `completed-date-column.tsx`, `reference-link-column.tsx`, `total-log-time-column.tsx`

## Overview

The workspace default view plan (phase-04) already created 7 column components. The project view reuses **5 of those 7** columns — `department-name-column.tsx` and `project-name-column.tsx` are excluded. This phase verifies those 5 columns work in project view context (same props, no workspace-level store assumptions), and updates display properties / constants to enable them for the project default view.

## Requirements

5 columns to include in project default view:

| Column              | File (CE)                      | Data Source                  | Editable | Reuse?   |
| ------------------- | ------------------------------ | ---------------------------- | -------- | -------- |
| `bank_wide_project` | `bank-wide-project-column.tsx` | `project.is_bank_wide`       | No       | ✅ Reuse |
| `progress_tracking` | `progress-tracking-column.tsx` | computed from `target_date`  | No       | ✅ Reuse |
| `completed_date`    | `completed-date-column.tsx`    | `issue.completed_at`         | No       | ✅ Reuse |
| `reference_link`    | `reference-link-column.tsx`    | IssueLink[] lazy-loaded      | No       | ✅ Reuse |
| `total_log_time`    | `total-log-time-column.tsx`    | `issue.total_logged_minutes` | No       | ✅ Reuse |

## Architecture

### Reuse Validation Checklist

For each of the 5 columns, verify:

- [ ] Does NOT use `useWorkspace().currentWorkspace.name` (that's workspace-only)
- [ ] Does NOT hardcode workspace slug — must use `issue.project_id` + `issue.workspace_id`
- [ ] Links endpoint in `reference-link-column.tsx`: uses `workspaceSlug` + `projectId` from issue props (not from workspace store)
- [ ] Worklog value in `total-log-time-column.tsx`: reads `issue.total_logged_minutes` (injected by annotation) — no store dependency

### If a column stores assume workspace scope

Fix: pass `workspaceSlug` + `projectId` as props from the parent, or derive from `issue` object.

### `getComputedDisplayProperties` (already patched)

The CE keys `bank_wide_project`, `progress_tracking`, `completed_date`, `reference_link`, `total_log_time` are already in the whitelist (added in workspace plan). No extra change needed here.

### `display_properties` Config for Project Default View

Only enable the 5 CE columns (not `department_name`/`project_name`):

```json
{
  "department_name": false,
  "project_name": false,
  "bank_wide_project": true,
  "progress_tracking": true,
  "completed_date": true,
  "reference_link": true,
  "total_log_time": true
}
```

## Related Files

- `apps/web/ce/components/issues/spreadsheet/columns/bank-wide-project-column.tsx` — verify + fix if needed
- `apps/web/ce/components/issues/spreadsheet/columns/progress-tracking-column.tsx` — verify
- `apps/web/ce/components/issues/spreadsheet/columns/completed-date-column.tsx` — verify
- `apps/web/ce/components/issues/spreadsheet/columns/reference-link-column.tsx` — verify
- `apps/web/ce/components/issues/spreadsheet/columns/total-log-time-column.tsx` — verify
- `packages/constants/src/issue/common.ts` — SPREADSHEET_PROPERTY_LIST, SPREADSHEET_PROPERTY_DETAILS
- `apps/web/ce/components/issues/issue-layouts/utils.tsx` — SPREADSHEET_COLUMNS

## Implementation Steps

### 3.1 Verify column context compatibility

- Open each of the 5 CE column files
- Check for any workspace-stores or workspace-only hooks
- Fix any `useWorkspace().currentWorkspace.name` references (should not be in these 5)
- Fix any hardcoded workspace slug references

### 3.2 Check `reference-link-column.tsx` link-fetch scope

- Verify it calls `issueDetail.link.fetchLinks(workspaceSlug, projectId, issueId)`
- `workspaceSlug` should come from `issue.workspace_slug` or a prop, NOT from `useWorkspace()`
- Confirm IntersectionObserver logic still works in project view context

### 3.3 Verify `SPREADSHEET_PROPERTY_LIST` ordering for project default view

Target 14-column order:

```
assignee, modules, bank_wide_project, key, sub_issue_count, priority,
cycle, state, progress_tracking, start_date, due_date,
completed_date, reference_link, total_log_time
```

> If `SPREADSHEET_PROPERTY_LIST` is a single shared array, the order set by workspace plan already determines rendering. Just verify the 5 CE columns appear at the right positions.

### 3.4 Verify `SPREADSHEET_PROPERTY_DETAILS` entries

- Confirm all 5 CE keys have proper `i18n title`, icon, and `sort key`
- These were added in workspace plan — verify they exist
- Add if missing

### 3.5 Verify SPREADSHEET_COLUMNS map entries

- In `utils.tsx`: confirm all 5 CE keys are mapped to their components
- If workspace plan added all 7, the 5 needed ones are already present

### 3.6 Verify `getComputedDisplayProperties` whitelist

- In `packages/utils/src/work-item/base.ts`
- Must include the 5 CE keys with `false` default
- Workspace plan added all 7 — verify

## Todo

- [ ] Read each of the 5 CE column files for workspace-store assumptions
- [ ] Fix any incompatible store usage for project context
- [ ] Verify SPREADSHEET_PROPERTY_LIST includes 5 CE keys in correct positions
- [ ] Verify SPREADSHEET_PROPERTY_DETAILS has entries for 5 CE keys
- [ ] Verify SPREADSHEET_COLUMNS map has 5 CE keys
- [ ] Verify getComputedDisplayProperties includes 5 CE keys

## Post-Phase Checklist

- [ ] Navigate to a project → views → daily status: all 5 CE columns render
- [ ] `bank_wide_project` shows Y/N badge from `project.is_bank_wide`
- [ ] `progress_tracking` shows color badge based on `target_date`
- [ ] `completed_date` shows formatted date or empty
- [ ] `reference_link` lazy-loads links when row is visible
- [ ] `total_log_time` shows "Xh Ym" format
- [ ] No errors in browser console related to workspace/project store context

## Success Criteria

- All 5 CE columns render correctly in project view spreadsheet
- No workspace-scoped data leaks into project view columns
- Each component < 80 lines (already satisfied from workspace plan)

## Risk Assessment

- **Moderate risk**: columns were built for workspace context; may have workspace-store dependencies
- **IntersectionObserver**: verify `reference-link-column.tsx` works within project view virtualized list
- **Worklog annotation**: if `ProjectViewIssuesViewSet` doesn't annotate, `total_log_time` shows 0

## Security Considerations

- Read-only columns; no user input handling
- Issue links render as text (href), not raw HTML (XSS safe)
- Project membership is enforced at API level, not in column components

## Next Steps

Phase 4: wire up default view in project views UI
