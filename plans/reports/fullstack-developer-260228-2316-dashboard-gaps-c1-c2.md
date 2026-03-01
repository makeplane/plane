# Phase Implementation Report

## Executed Phase

- Phase: phase-08-implement-gaps (Steps 1 + 2)
- Plan: /Volumes/Data/SHBVN/plane.so/plans/260228-1034-dashboard-v2-test-plan/
- Status: completed

## Files Modified

| File                                                                       | Change                                                                                                                                     |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/web/ce/components/dashboards/dashboard-form-modal.tsx`               | Added multi-select project picker field; updated `DashboardFormPayload` to include `project_ids: string[]`; added `useProject` hook import |
| `apps/web/ce/components/dashboards/widget-config-tab-content.tsx`          | Pass `chartType` prop to `BasicSettingsSection`                                                                                            |
| `apps/web/ce/components/dashboards/config/basic-settings-section.tsx`      | Accept `chartType` prop; use `ANALYTICS_NUMBER_METRIC_OPTIONS` for NUMBER type, `ANALYTICS_CHART_METRIC_OPTIONS` for others                |
| `packages/constants/src/custom-dashboard.ts`                               | Added `ANALYTICS_NUMBER_METRIC_OPTIONS` with all 8 metrics matching backend `METRICS_MAP` keys exactly                                     |
| `apps/web/app/routes/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx` | Updated `handleCreate`/`handleUpdate` to use `DashboardFormPayload` type                                                                   |
| `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx`        | Updated `handleCreate`/`handleUpdate` to use `DashboardFormPayload` type                                                                   |
| `packages/i18n/src/locales/en/translations.ts`                             | Added 4 new keys: `projects_label`, `projects_hint`, `projects_selected`, `no_projects`                                                    |
| `packages/i18n/src/locales/ko/translations.ts`                             | Same 4 keys in Korean                                                                                                                      |
| `packages/i18n/src/locales/vi/translations.ts`                             | Same 4 keys in Vietnamese                                                                                                                  |

## Tasks Completed

- [x] C1: Project picker in dashboard form — scrollable checklist of workspace projects, pre-populates on edit, sends `project_ids` in payload
- [x] C2: Add 6 missing metrics to `ANALYTICS_NUMBER_METRIC_OPTIONS` constant
- [x] C2: `BasicSettingsSection` shows full 8-metric list for NUMBER chart type, 2-metric list for others
- [x] `DashboardFormPayload` type updated — `project_ids: string[]` included
- [x] Both page files updated to use new payload type
- [x] i18n keys added to en, ko, vi
- [x] Build check passed

## Tests Status

- Type check: pass (build completed cleanly — `✓ built in 4.73s`)
- Unit tests: not run (no existing unit tests for dashboard components)
- Integration tests: n/a

## Implementation Notes

**C1 project picker design:**

- Uses `workspaceProjectIds` + `getProjectById` from `useProject` hook
- Renders scrollable `max-h-40` list inside `border-color-subtle` border
- Each row: checkbox square (semantic colors), project name, identifier badge
- Toggle logic: `setValue("project_ids", ...)` via `watch` + click handler
- Pre-populates from `dashboard?.projects` on edit open
- Shows count hint below list when projects are selected

**C2 metric keys (exact match to backend `METRICS_MAP`):**

```
count, estimate_points, PENDING_WORK_ITEMS, COMPLETED_WORK_ITEMS,
IN_PROGRESS_WORK_ITEMS, BLOCKED_WORK_ITEMS, WORK_ITEMS_DUE_TODAY,
WORK_ITEMS_DUE_THIS_WEEK
```

`WORK_ITEMS_DUE_TODAY` and `WORK_ITEMS_DUE_THIS_WEEK` are handled by `resolve_aggregation()` in backend (not in `METRICS_MAP` directly but supported).

## Issues Encountered

None.

## Next Steps

- Steps 3–9 from phase-08 remain (H2 chart drill-down, M3 donut center value, M2 line type, M1 bar horizontal, M4 number text align, H1 drag-drop, L1 favorite)
- C1 fix unblocks widget data tests — dashboards with projects selected will now show real chart data
