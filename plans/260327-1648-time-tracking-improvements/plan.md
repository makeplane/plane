# Time-Tracking Feature Improvements

**Status:** Complete
**Branch:** ngoc-feat/workspaces-default-view
**Created:** 2026-03-27

## Overview

Complete overhaul of 3 time-tracking tabs + new Cross Workspaces feature.

## Phases

| #   | Phase                                                                                           | Status   | Priority |
| --- | ----------------------------------------------------------------------------------------------- | -------- | -------- |
| 1   | [Backend: My Timesheet read-only + Analytics endpoint](phase-01-backend-timesheet-analytics.md) | Complete | High     |
| 2   | [Backend: Capacity improvements + Categories](phase-02-backend-capacity.md)                     | Complete | High     |
| 3   | [Backend: Cross Workspaces endpoints](phase-03-backend-cross-workspace.md)                      | Complete | Medium   |
| 4   | [Frontend: My Timesheet tab](phase-04-frontend-timesheet.md)                                    | Complete | High     |
| 5   | [Frontend: Analytics tab redesign](phase-05-frontend-analytics.md)                              | Complete | High     |
| 6   | [Frontend: Capacity tab improvements](phase-06-frontend-capacity.md)                            | Complete | High     |
| 7   | [Frontend: Cross Workspaces feature](phase-07-frontend-cross-workspace.md)                      | Complete | Medium   |

## Key Decisions

- Analytics endpoint: new `ProjectAnalyticsTimesheetEndpoint` (distinct from `ProjectWorkLogSummaryEndpoint`)
- Capacity categories: group issues by `main_task_category__name` and `sub_task_category__name` FK fields on Issue model (NOT label-based — confirmed via validation)
- Cross Workspace: new endpoints under workspace-level (not project-level), no pagination needed
- Both My Timesheet and Analytics: read-only enforced at frontend only (no backend changes)
- Capacity: open to MEMBER role (not just ADMIN)
- Capacity thresholds: hardcoded 480min=8h (no per-project config)

## Related Files

**Backend:**

- `apps/api/plane/app/views/workspace/time_tracking/timesheet_grid.py`
- `apps/api/plane/app/views/workspace/time_tracking/summary.py`
- `apps/api/plane/app/views/capacity.py`

**Frontend:**

- `apps/web/ce/components/time-tracking/timesheet/`
- `apps/web/ce/components/time-tracking/capacity/`
- `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/time-tracking/analytics/page.tsx`

## Validation Log

### Session 1 — 2026-03-27

**Trigger:** Initial plan validation before implementation.
**Questions asked:** 5

#### Questions & Answers

1. **[Architecture]** Phase 02 plans label-based category grouping for the Capacity Categories endpoint. Which grouping should be used?
   - Options: Label-based | Issue-type-based | Both
   - **Answer:** Other — "I didn't mention labels at all, I said to get the 2 fields main task category and sub task category of workitems"
   - **Custom input:** "ủa tôi đâu có đề cập gì đến label đâu ta tôi nói là lấy 2 cái field main task category và sub task category của workitems đấy"
   - **Rationale:** `main_task_category` and `sub_task_category` are actual FK relations on the Issue model (confirmed by grep: `main_task_category__name` in `ho.py`, `issue/base.py`). The backend endpoint must group by these fields, NOT by label.

2. **[Architecture]** Category field clarification: what are `main_task_category` / `sub_task_category`?
   - Options: Actual model fields | Type/Kind field | Parent-based + type name
   - **Answer:** Actual model fields
   - **Rationale:** Confirmed FK relations. `ProjectCapacityCategoriesEndpoint` must use `.values("main_task_category__name").annotate(count=...)` and `.values("sub_task_category__name").annotate(count=...)` — no parent filter needed, no label filter needed.

3. **[Assumptions]** My Timesheet read-only: frontend-only or backend-enforced?
   - Options: Frontend-only (Recommended) | Backend enforce too
   - **Answer:** Frontend-only
   - **Rationale:** No backend changes needed. Remove UI buttons and save callbacks only.

4. **[Risks]** Cross Workspace capacity: paginate or return all members?
   - Options: No pagination (Recommended) | Limit to active members | Add cursor pagination
   - **Answer:** No pagination
   - **Rationale:** Return all members. Keep implementation simple.

5. **[Architecture]** Capacity thresholds: hardcoded or configurable?
   - Options: Hardcoded 8h/day (Recommended) | Configurable per project
   - **Answer:** Hardcoded 8h/day
   - **Rationale:** Keep existing 480min threshold constants. No new model fields needed.

#### Confirmed Decisions

- Categories: use `main_task_category__name` and `sub_task_category__name` FK fields, no labels, no parent filter
- Read-only: frontend-only enforcement
- Cross-workspace capacity: no pagination
- Thresholds: 480min hardcoded

#### Action Items

- [ ] Rewrite `ProjectCapacityCategoriesEndpoint` to group by `main_task_category__name` / `sub_task_category__name` instead of label
- [ ] Update `category-count-table.tsx` types — response shape may differ (two flat lists by category name)
- [ ] Remove label-relation note from Phase 02

#### Impact on Phases

- Phase 2: Replace label-based grouping with `main_task_category__name` / `sub_task_category__name` grouping
- Phase 6: No change needed — response shape `{name, count}[]` is the same, just data source changes

---

### Session 2 — 2026-03-27

**Trigger:** Pre-implementation re-validation to resolve ambiguities in phases 03, 05, 07.
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** Where should new store actions live? Phases 05 and 07 say 'core worklog store or CE store' — the plan is ambiguous.
   - Options: CE worklog store | Core worklog store
   - **Answer:** CE worklog store
   - **Rationale:** All new store actions (`fetchAnalyticsTimesheet`, `fetchCrossWorkspaceTimesheet`, `fetchCrossWorkspaceCapacity`, `fetchCapacityCategories`, `fetchCapacityDayDetails`) go in `apps/web/ce/store/worklog.store.ts`. Consistent with CE pattern — new features only in `ce/`.

2. **[Assumptions]** Cross-workspace timesheet: show ALL assigned issues or ONLY issues with worklogs in the selected week?
   - Options: Only issues with worklogs this week | All assigned issues
   - **Answer:** Only issues with worklogs this week
   - **Rationale:** Consistent with My Timesheet behavior. Phase 03 backend (`CrossWorkspaceTimesheetEndpoint`) must be updated — remove `assigned_issues` full-scan, instead query `IssueWorkLog` for the week then enrich with issue metadata (same pattern as `ProjectAnalyticsTimesheetEndpoint`).

3. **[Architecture]** Cross Workspaces + Capacity: heatmap cell behavior when cross-workspace active.
   - Options: Non-clickable in CW mode | Keep clickable, show nothing
   - **Answer:** Non-clickable in CW mode
   - **Rationale:** When `isCrossWorkspace` is true in capacity dashboard, render heatmap cells as plain `<div>` (no `<CapacityDayDetailsPopover>` wrapper). Phase 07 must pass `isCrossWorkspace` to `CapacityHeatmap` and branch on it.

4. **[Scope]** Execution order: backend-first or pair per feature?
   - Options: Backend first (1→2→3), then frontend (4→5→6→7) | Pair per feature
   - **Answer:** Backend first (1→2→3), then frontend (4→5→6→7)
   - **Rationale:** APIs stable before frontend work. No stub/mock needed in frontend phases.

#### Confirmed Decisions

- Store: all new actions in CE worklog store (`apps/web/ce/store/worklog.store.ts`)
- CW timesheet: only rows with worklogs in the week (not all assigned issues)
- CW capacity heatmap: plain non-clickable cells when cross-workspace active
- Execution: phases 1→2→3→4→5→6→7 in order

#### Action Items

- [ ] Update Phase 03 backend — rewrite `CrossWorkspaceTimesheetEndpoint` to query by worklogs (not assigned issues)
- [ ] Update Phase 05 — change "core store or CE store" to "CE worklog store"
- [ ] Update Phase 07 — change "core store or CE store" to "CE worklog store"; add `isCrossWorkspace` prop to `CapacityHeatmap` + branch for plain cell vs popover

#### Impact on Phases

- Phase 3: `CrossWorkspaceTimesheetEndpoint` logic change — use worklog-first query, drop `assigned_issues` pre-fetch
- Phase 5: Store target clarified → `apps/web/ce/store/worklog.store.ts`
- Phase 7: Store target clarified; heatmap must receive `isCrossWorkspace` prop and render plain cell when true
