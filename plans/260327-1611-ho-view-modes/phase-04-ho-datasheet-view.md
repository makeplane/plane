# Phase 4: Datasheet View Component

## Context Links

- [Plan Overview](./plan.md)
- [Phase 3 — Store & Service](./phase-03-ho-store-service.md)
- Spreadsheet header column: `apps/web/core/components/issues/issue-layouts/spreadsheet/columns/header-column.tsx`
- Spreadsheet property constants: `packages/constants/src/issue/common.ts` (SPREADSHEET_PROPERTY_LIST, SPREADSHEET_PROPERTY_DETAILS)
- CE column components: `apps/web/ce/components/issues/spreadsheet/columns/`
- Display properties filter: `apps/web/core/components/issues/issue-layouts/filters/header/display-filters/display-properties.tsx`
- CE spreadsheet utils: `apps/web/ce/components/issues/issue-layouts/utils.tsx`

## Overview

- **Priority**: P1
- **Status**: pending
- **Effort**: 2d
- **Description**: Implement `HoDatasheetView` — a read-only spreadsheet table showing cross-workspace issues with 19 columns (issue title fixed + 18 display property columns), sortable headers, display properties toggle panel, and infinite scroll / load-more pagination.

## Key Insights

- **Reuse column renderers**: The 18 CE column components (`SpreadsheetDepartmentNameColumn`, `SpreadsheetProjectNameColumn`, etc.) handle display — but they take `issue: TIssue` and call update handlers. Since HO issues are `THoIssue` (different type), we need adapter logic or create thin wrappers.
- **Adapter approach**: Cast `THoIssue` to a partial `TIssue`-compatible shape for column props — OR create separate read-only cell renderers. **Preferred**: create a `HoIssueRow` that renders cells directly (simpler, avoids type hacks).
- **Read-only**: No `onChange` handlers, no inline editing. Cells are display-only divs (not interactive).
- **Sticky first column**: Issue title column is sticky-left (same as standard spreadsheet). Subsequent columns scroll horizontally.
- **Sort**: Column header dropdown (Ascending / Descending / Clear) calls `hoIssueStore.updateOrderBy(key)`. Backend handles sorting.
- **Display properties panel**: Reuse the pattern from `DisplayPropertiesFilter` — a panel toggled by a button in the toolbar showing checkboxes per column. Calls `hoIssueStore.updateDisplayProperties()`.
- **Grouping in data**: Data arrives pre-sorted from backend (Department → Project → Main Category → Sub Category). Visually, same-value cells in Department, Team/Project, Main Category, Sub Category columns can show a subtle separator line between groups (no cell merging needed — keep simple).
- **Load more**: Show "Load more" button at bottom or trigger on scroll (use button for simplicity).

## Requirements

### Functional

- Table with fixed first column (issue title "Work Items") + 18 toggleable property columns
- Default: all 18 columns visible
- Column header: click → sort dropdown (Asc / Desc / Clear) for sortable columns; plain text for non-sortable
- Display properties toolbar button → panel to toggle column visibility
- Data fetched on mount via `hoIssueStore.fetchIssues()`
- Load more button when `nextPageUrl` is not null
- Loading skeleton while fetching
- Empty state when no issues

### Non-functional

- Horizontal scroll for overflow columns
- Sticky first column (issue name)
- File sizes: root <150L, row <100L, toolbar <80L

## Architecture

```
apps/web/ce/components/ho/
├── ho-datasheet-view.tsx          (root — fetches data, renders toolbar + table)
├── ho-datasheet-toolbar.tsx       (search bar area + display properties button)
├── ho-datasheet-table.tsx         (table with sticky header + scrollable body)
├── ho-datasheet-header.tsx        (thead with sortable column headers)
├── ho-datasheet-row.tsx           (tbody tr rendering one THoIssue)
└── ho-datasheet-display-props.tsx (display property toggle panel)
```

### Column Order (matches user spec)

```ts
// Fixed first column (always visible, not in display properties)
"name"; // Work Items — issue title

// Display property columns in order:
const HO_DATASHEET_COLUMNS: (keyof IIssueDisplayProperties)[] = [
  "department_name", // 1. Department
  "project_name", // 2. Team/Project
  "main_task_category", // 3. Main Task Category
  "sub_task_category", // 4. Sub Task Category
  "sub_issue_count", // 6. Number of Sub Work Items
  "project_lead", // 7. Team/Project Lead
  "assignee", // 8. Assignee
  "bank_wide_project", // 9. Bank-wide project
  "priority", // 10. Priority
  "state", // 11. Status
  "progress_tracking", // 12. Progress Tracking
  "modules", // 13. Module
  "cycle", // 14. Cycle
  "start_date", // 15. Start Date
  "due_date", // 16. Due Date
  "completed_date", // 17. Completed Date
  "total_log_time", // 18. Total Logtime
  "reference_link", // 19. Reference Link
];
```

### Cell Value Mapping (THoIssue → display)

<!-- Updated: Validation Session 1 - Issue title column renders as clickable link to issue detail page -->

| Column key           | THoIssue field               | Display                                                                                                   |
| -------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------- |
| **name** (fixed col) | `name`                       | `<a href="/{workspaceSlug}/projects/{project_id}/issues/{id}" target="_blank" rel="noopener noreferrer">` |
| department_name      | `department_name`            | text                                                                                                      |
| project_name         | `project_name`               | text                                                                                                      |
| main_task_category   | `main_task_category_name`    | text or "—"                                                                                               |
| sub_task_category    | `sub_task_category_name`     | text or "—"                                                                                               |
| sub_issue_count      | `sub_issues_count`           | number                                                                                                    |
| project_lead         | `project_lead`               | text or "—"                                                                                               |
| assignee             | `assignees[].display_name`   | avatar + name list                                                                                        |
| bank_wide_project    | `is_bank_wide_project`       | badge or checkbox (read-only)                                                                             |
| priority             | `priority`                   | PriorityIcon + label                                                                                      |
| state                | `state_name` + `state_color` | colored dot + name                                                                                        |
| progress_tracking    | `progress_tracking`          | text badge                                                                                                |
| modules              | `module_names[]`             | comma list or badges                                                                                      |
| cycle                | `cycle_name`                 | text or "—"                                                                                               |
| start_date           | `start_date`                 | formatted date                                                                                            |
| due_date             | `target_date`                | formatted date                                                                                            |
| completed_date       | `completed_at`               | formatted date                                                                                            |
| total_log_time       | `total_log_time` (minutes)   | "Xh Ym" formatted                                                                                         |
| reference_link       | `reference_links[]`          | link icons                                                                                                |

### Sort Integration

Column headers use `SPREADSHEET_PROPERTY_DETAILS[key].ascendingOrderKey` / `descendingOrderKey` values (already defined in constants). Passing the selected key to `hoIssueStore.updateOrderBy(orderKey)`.

### Visual Grouping

Between rows where `department_name` changes: add `border-t-2 border-subtle` on that `<tr>`.
Between rows where `project_name` changes (within same dept): `border-t border-subtle` (lighter).
No merging, no rowspan — just visual separators.

## Related Code Files

- **Create**: `apps/web/ce/components/ho/ho-datasheet-view.tsx`
- **Create**: `apps/web/ce/components/ho/ho-datasheet-toolbar.tsx`
- **Create**: `apps/web/ce/components/ho/ho-datasheet-table.tsx`
- **Create**: `apps/web/ce/components/ho/ho-datasheet-header.tsx`
- **Create**: `apps/web/ce/components/ho/ho-datasheet-row.tsx`
- **Create**: `apps/web/ce/components/ho/ho-datasheet-display-props.tsx`
- **Modify**: `apps/web/app/(all)/[workspaceSlug]/(projects)/ho/page.tsx` — replace Datasheet placeholder

## Embedded Rules

```
- observer() from mobx-react on every component that reads MobX store
- useHoIssues() hook to access HoIssueStore
- Semantic tokens: text-primary, text-secondary, text-placeholder, border-subtle, bg-surface-1, bg-layer-1
- @plane/propel/* subpath imports (IconButton, Badge, Tooltip, etc.)
- renderFormattedDate() from @plane/utils for date formatting
- SPREADSHEET_PROPERTY_DETAILS from @plane/constants for column metadata (titles, sort keys)
- File <150 lines per component — split further if needed
- No inline editing — no onChange, no update handlers
- Prettier: 120-char line width
```

## Implementation Steps

1. **`ho-datasheet-view.tsx`** (root):
   - `observer` component
   - On mount: call `hoIssueStore.fetchIssues()`
   - Renders: `<HoDatasheetToolbar>` + `<HoDatasheetTable>` + Load More button
   - Shows `<SpreadsheetLayoutLoader>` while loading
   - Shows empty state when `issues.length === 0`

2. **`ho-datasheet-toolbar.tsx`**:
   - Display properties toggle button (gear/settings icon)
   - Toggles `<HoDatasheetDisplayProps>` panel (popover)
   - **Date range pickers**: two Plane `DatePicker` components (From / To), both default to today <!-- Updated: Validation Session 3 - Use Plane DatePicker component, not native input -->
   - On date change → call `hoIssueStore.setDateRange(from, to)` immediately (no debounce) → store re-fetches <!-- Updated: Validation Session 3 - Immediate re-fetch, no debounce or Apply button -->
   - Date range state is shared — persists when user switches to Category tab via `hoIssueStore.fromDate`/`toDate` <!-- Updated: Validation Session 3 - Shared store state across views -->
   - No search bar (department list has search; datasheet uses column sort instead)

<!-- Updated: Validation Session 2 - Toolbar needs From/To date pickers defaulting to today; change triggers setDateRange() → backend re-fetch -->

3. **`ho-datasheet-display-props.tsx`**:
   - Renders a list of `HO_DATASHEET_COLUMNS` with toggle checkboxes
   - Reads `hoIssueStore.displayProperties`, calls `updateDisplayProperties()` on toggle
   - Column labels from `SPREADSHEET_PROPERTY_DETAILS[key].i18n_title` (or hardcoded English labels)

4. **`ho-datasheet-header.tsx`**:
   - `<thead>` with `<th>` per visible column
   - First `<th>`: "Work Items" — sticky, no sort
   - Other `<th>`: uses `SPREADSHEET_PROPERTY_DETAILS[key]` to show title + sort dropdown (CustomMenu)
   - Sort dropdown: Ascending / Descending / Clear — calls `hoIssueStore.updateOrderBy(key)`
   - Active sort column highlighted

5. **`ho-datasheet-row.tsx`**:
   - `<tr>` for one `THoIssue`
   - Props: `issue: THoIssue`, `displayProperties`, `isNewDeptGroup: boolean`, `isNewProjectGroup: boolean`
   - First `<td>`: issue name as `<a>` link to `/{workspaceSlug}/projects/{project_id}/issues/{id}` (sticky, min-w-[280px], `target="_blank" rel="noopener noreferrer"`)
   - Other `<td>`: render cell value per column key (simple div/span, not interactive)
   - Apply group separator border classes via `isNewDeptGroup` / `isNewProjectGroup`

6. **`ho-datasheet-table.tsx`**:
   - Wraps `<HoDatasheetHeader>` + tbody of `<HoDatasheetRow>`s
   - Computes `isNewDeptGroup` / `isNewProjectGroup` by comparing consecutive rows
   - `overflow-x-auto horizontal-scrollbar scrollbar-lg`

7. **Update `ho/page.tsx`**: replace Datasheet placeholder `<div>Coming soon</div>` with `<HoDatasheetView />`

8. **Verify**: Load HO → Datasheet tab; all 18 columns visible; click sort on project_name; verify URL + re-fetch; toggle display props off/on.

## Post-Phase Checklist

- [ ] `pnpm check:lint` — 0 errors
- [ ] All 19 columns render (1 fixed + 18 toggleable)
- [ ] Sortable columns show dropdown on header click
- [ ] Non-sortable columns (department_name, project_lead, bank_wide_project) show plain header
- [ ] Display properties panel toggles column visibility
- [ ] Visual group separators between department/project groups
- [ ] Load More button appears when more pages exist; fetches next page on click
- [ ] Loading skeleton shown on initial fetch
- [ ] Empty state shown when no issues
- [ ] All files < 150 lines

## Todo List

- [ ] `ho-datasheet-view.tsx`
- [ ] `ho-datasheet-toolbar.tsx`
- [ ] `ho-datasheet-display-props.tsx`
- [ ] `ho-datasheet-header.tsx`
- [ ] `ho-datasheet-row.tsx`
- [ ] `ho-datasheet-table.tsx`
- [ ] Update `ho/page.tsx`

## Success Criteria

- All 19 columns visible in correct order
- Sort works (re-fetches with new order_by)
- Display properties toggle works
- Data grouped visually by department then project

## Risk Assessment

- **THoIssue vs TIssue type mismatch**: Cannot reuse existing column components directly. Mitigation: build thin cell renderers in `HoDatasheetRow` — more code but avoids type hacks.
- **Assignees rendering**: Multiple assignees — render up to 3 avatars + "+N" overflow badge.
- **reference_links array**: Render as clickable link icons. Handle empty array gracefully.
- **total_log_time formatting**: Convert minutes to "Xh Ym" string. Utility: `Math.floor(mins/60)` + `mins%60`.

## Security Considerations

- All links open `target="_blank" rel="noopener noreferrer"`
- No user-input rendered as HTML — all text via React children (XSS safe)

## Next Steps

- Phase 5 (Category View) can run in parallel with this phase
