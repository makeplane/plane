# Phase 4: Frontend -- New Spreadsheet Columns

## Context

- Column components: `apps/web/core/components/issues/issue-layouts/spreadsheet/columns/`
- CE column map: `apps/web/ce/components/issues/issue-layouts/utils.tsx` (`SPREADSHEET_COLUMNS`)
- Type: `IIssueDisplayProperties` in `packages/types/src/view-props.ts`
- Constants: `SPREADSHEET_PROPERTY_LIST` + `SPREADSHEET_PROPERTY_DETAILS` in `packages/constants/src/issue/common.ts`
- Column signature: `TSpreadsheetColumn` = `FC<{issue, onClose, onChange, disabled}>`

## Overview

Create 7 new column components in CE, extend `IIssueDisplayProperties` with new keys, update `SPREADSHEET_COLUMNS` map, and add entries to `SPREADSHEET_PROPERTY_LIST` + `SPREADSHEET_PROPERTY_DETAILS`.

## Requirements

7 new columns: `department_name`, `project_name`, `bank_wide_project`, `progress_tracking`, `completed_date`, `reference_link`, `total_log_time`

## Architecture

### New Column Components (all in `apps/web/ce/components/issues/spreadsheet/columns/`)

| Column                         | Data Source                                                 | Editable | Notes                                                                                                                                                  |
| ------------------------------ | ----------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `department-name-column.tsx`   | `workspace.name` via `useWorkspace().currentWorkspace.name` | No       | <!-- Updated: Validation Session 2 - department = workspace name, no new field --> Read-only, derived from workspace name                              |
| `project-name-column.tsx`      | `project.name` via `useProject().getProjectById()`          | No       | Uses `issue.project_id`                                                                                                                                |
| `bank-wide-project-column.tsx` | `project.is_bank_wide` via project store                    | No       | Renders Y/N badge                                                                                                                                      |
| `progress-tracking-column.tsx` | Computed from `issue.target_date` vs today                  | No       | Color-coded status badge                                                                                                                               |
| `completed-date-column.tsx`    | `issue.completed_at`                                        | No       | Date format, null-safe                                                                                                                                 |
| `reference-link-column.tsx`    | `IssueLink[]` lazy-loaded via IntersectionObserver          | No       | <!-- Updated: Validation Session 2 - IntersectionObserver confirmed, fetch only on visibility --> Fetch links only when row is visible; clickable URLs |
| `total-log-time-column.tsx`    | `issue.total_logged_minutes` or worklog store               | No       | Format as hours:minutes                                                                                                                                |

### Progress Tracking Logic

```typescript
function getProgressStatus(targetDate: string | null): { label: string; color: string } {
  if (!targetDate) return { label: "—", color: "text-secondary" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return { label: "Off Track", color: "text-status-red" };
  if (diffDays === 0) return { label: "Due Today", color: "text-status-red" };
  if (diffDays === 1) return { label: "At Risk", color: "text-status-amber" };
  return { label: "On Track", color: "text-status-green" };
}
```

## Related Files

- `packages/types/src/view-props.ts` -- `IIssueDisplayProperties`
- `packages/constants/src/issue/common.ts` -- `SPREADSHEET_PROPERTY_LIST`, `SPREADSHEET_PROPERTY_DETAILS`
- `apps/web/ce/components/issues/issue-layouts/utils.tsx` -- `SPREADSHEET_COLUMNS`
- `apps/web/core/components/issues/issue-layouts/spreadsheet/issue-column.tsx` -- consumes map

## Implementation Steps

### 4.1 Extend `IIssueDisplayProperties` type

- Add 7 optional boolean keys to interface in `packages/types/src/view-props.ts`

<!-- Updated: Validation Session 1 - Column order is FIXED for default view -->

### 4.2 Update `SPREADSHEET_PROPERTY_LIST`

- Add 7 new keys in desired column order
- **Note**: order in this array determines column display order
- **Default view constraint**: column order is FIXED (non-reorderable). User-created views remain free to reorder.
- Enforced in Phase 5 by hiding drag handles when `view.is_default === true`

### 4.3 Update `SPREADSHEET_PROPERTY_DETAILS`

- Add entries for each new key (i18n title, sort keys, icon)
- For non-sortable columns (department, progress), use `-created_at` as fallback sort

### 4.4 Create column components

- Each file < 80 lines, follows `TSpreadsheetColumn` signature
- Store in `apps/web/ce/components/issues/spreadsheet/columns/`
- Create barrel `index.ts` for clean imports

### 4.5 Update `SPREADSHEET_COLUMNS` map in CE utils

- Import all 7 new components
- Add to the map object

### 4.6 Update `get_default_display_properties()` in backend

- Add new keys with `False` default (only enabled in default view config)

## Todo

- [ ] Add 7 keys to `IIssueDisplayProperties`
- [ ] Create `department-name-column.tsx`
- [ ] Create `project-name-column.tsx`
- [ ] Create `bank-wide-project-column.tsx`
- [ ] Create `progress-tracking-column.tsx`
- [ ] Create `completed-date-column.tsx`
- [ ] Create `reference-link-column.tsx`
- [ ] Create `total-log-time-column.tsx`
- [ ] Create barrel `index.ts`
- [ ] Update `SPREADSHEET_PROPERTY_LIST` ordering
- [ ] Update `SPREADSHEET_PROPERTY_DETAILS` entries
- [ ] Update `SPREADSHEET_COLUMNS` in CE utils
- [ ] Update backend `get_default_display_properties()`

## Success Criteria

- All 7 columns render in spreadsheet when enabled
- Columns follow `TSpreadsheetColumn` signature
- Non-sortable columns gracefully degrade in header menu
- Each component < 80 lines

## Risk Assessment

- **Reference link N+1**: must lazy-load, fetch only when row is visible
- **Worklog data**: depends on Phase 3 annotation; fallback to store method
- **Column width**: new columns may need min-width tweaks in td styling

## Security Considerations

- Read-only columns; no user input handling needed
- Issue links render as text, not raw HTML (XSS safe)

## Next Steps

Phase 5: wire up default view in UI
