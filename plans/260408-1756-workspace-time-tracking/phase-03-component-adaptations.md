# Phase 03 — Component Adaptations

## Context Links

- TimesheetGrid: `apps/web/ce/components/time-tracking/timesheet/timesheet-grid.tsx`
- CapacityDashboard: `apps/web/ce/components/time-tracking/capacity/capacity-dashboard.tsx`
- AnalyticsTimesheetGrid: `apps/web/ce/components/time-tracking/analytics/analytics-timesheet-grid.tsx`
- Analytics barrel: `apps/web/ce/components/time-tracking/analytics/index.ts`

## Overview

- **Priority**: P1 (blocks Phase 4)
- **Status**: Pending
- **Description**: Adapt existing components for workspace reuse + create `WorkspaceAnalyticsTimesheetGrid`.

## Key Insights

- `TimesheetGrid` already has `isCrossWorkspace` toggle — workspace version just starts in that mode and hides toggle
- `CapacityDashboard` same — already has cross-workspace toggle logic
- `AnalyticsTimesheetGrid` is project-scoped with no cross-workspace — workspace needs separate component calling workspace endpoint
- `AnalyticsTimesheetTable` (the table renderer) can be reused directly

## Related Code Files

### Modify

- `apps/web/ce/components/time-tracking/timesheet/timesheet-grid.tsx` — add `defaultCrossWorkspace` prop, make `projectId` optional
- `apps/web/ce/components/time-tracking/capacity/capacity-dashboard.tsx` — add `defaultCrossWorkspace` prop, make `projectId` optional
- `apps/web/ce/components/time-tracking/analytics/index.ts` — export new component

### Create

- `apps/web/ce/components/time-tracking/analytics/workspace-analytics-timesheet-grid.tsx`

## Implementation Steps

### 1. Audit existing call sites first

Before making `projectId` optional, audit all existing callers of `TimesheetGrid` and `CapacityDashboard`:

- Search for `<TimesheetGrid` and `<CapacityDashboard` across the codebase
- Verify all callers still pass `projectId` as required (not optional)
- Document findings in implementation notes

### 2. TimesheetGrid — add `defaultCrossWorkspace` prop

```diff
 interface TimesheetGridProps {
   workspaceSlug: string;
-  projectId: string;
+  projectId?: string;
+  defaultCrossWorkspace?: boolean;
 }

+// Runtime guard: throw if neither projectId nor defaultCrossWorkspace
+if (!projectId && !defaultCrossWorkspace) {
+  throw new Error("TimesheetGrid requires either projectId or defaultCrossWorkspace");
+}

-export const TimesheetGrid: FC<TimesheetGridProps> = observer(({ workspaceSlug, projectId }) => {
+export const TimesheetGrid: FC<TimesheetGridProps> = observer(({ workspaceSlug, projectId, defaultCrossWorkspace = false }) => {
   ...
-  const [isCrossWorkspace, setIsCrossWorkspace] = useState(false);
+  const [isCrossWorkspace, setIsCrossWorkspace] = useState(defaultCrossWorkspace);
```

- When `defaultCrossWorkspace=true`: hide the toggle button (always cross-workspace)
- In `fetchData`: when `isCrossWorkspace`, skip project-scoped fetch (already done)
- Pass `projectId={projectId ?? ""}` to `TimesheetTable` (table uses it for links — graceful fallback)

Toggle button conditional:

```tsx
{!defaultCrossWorkspace && (
  <button onClick={() => setIsCrossWorkspace((v) => !v)} ...>
    {t("timesheet_cross_workspaces")}
  </button>
)}
```

### 2. CapacityDashboard — add `defaultCrossWorkspace` prop

```diff
 interface ICapacityDashboardProps {
   workspaceSlug: string;
-  projectId: string;
+  projectId?: string;
+  defaultCrossWorkspace?: boolean;
 }

-export const CapacityDashboard = observer((props: ICapacityDashboardProps) => {
+export const CapacityDashboard = observer((props: ICapacityDashboardProps) => {
```

- `const [isCrossWorkspace, setIsCrossWorkspace] = useState(props.defaultCrossWorkspace ?? false);`
- Hide toggle button when `defaultCrossWorkspace=true`
- Guard `fetchCapacityReport` call: skip if `!projectId && !isCrossWorkspace`
- Guard `fetchCapacityCategories` call: skip if `!projectId`
- **Conditionally exclude `MemberDropdown` from render entirely when `!projectId && isCrossWorkspace`** — not just CSS hide (fixes RT-11)
- Pass `projectId={projectId ?? ""}` to `CapacityHeatmap`

### 3. WorkspaceAnalyticsTimesheetGrid (NEW)

Create `workspace-analytics-timesheet-grid.tsx` (~100 lines):

- Props: `{ workspaceSlug: string }`
- Calls `worklogStore.fetchWorkspaceAnalyticsTimesheet(workspaceSlug, weekStart)`
- Reads `worklogStore.workspaceAnalyticsTimesheetData` + `isWorkspaceAnalyticsTimesheetLoading` + `workspaceAnalyticsTimesheetError`
- Renders `TimesheetWeekNavigator` + `AnalyticsTimesheetTable` (same as project version)
- **Loading state**: Show skeleton while `isWorkspaceAnalyticsTimesheetLoading`
- **Error state**: Show error message if `workspaceAnalyticsTimesheetError` is set
- `AnalyticsTimesheetTable` receives `projectId=""` — table uses `issue_identifier` with project prefix for links (fixes RT-13)
- Issue link target: `/:ws/projects/:projectId/issues/:issueId` using `row.project_id`

### 4. Update barrel export

```typescript
// analytics/index.ts
export { AnalyticsTimesheetGrid } from "./analytics-timesheet-grid";
export { WorkspaceAnalyticsTimesheetGrid } from "./workspace-analytics-timesheet-grid";
```

## Todo List

- [ ] Audit existing `TimesheetGrid` and `CapacityDashboard` call sites
- [ ] Add runtime guard (throw if neither projectId nor defaultCrossWorkspace)
- [ ] Add `defaultCrossWorkspace` + optional `projectId` to `TimesheetGrid`
- [ ] Hide cross-workspace toggle when `defaultCrossWorkspace=true` in `TimesheetGrid`
- [ ] Add `defaultCrossWorkspace` + optional `projectId` to `CapacityDashboard`
- [ ] Hide cross-workspace toggle when `defaultCrossWorkspace=true` in `CapacityDashboard`
- [ ] Conditionally exclude `MemberDropdown` when cross-workspace (not just CSS hide)
- [ ] Create `workspace-analytics-timesheet-grid.tsx` with loading/error states
- [ ] Update `analytics/index.ts` barrel export

## Success Criteria

- Project-level pages unchanged (default props = false/required)
- Workspace pages pass `defaultCrossWorkspace={true}` — toggle hidden, always cross-workspace
- `WorkspaceAnalyticsTimesheetGrid` renders analytics across all projects

## Risk Assessment

- **Medium**: `AnalyticsTimesheetTable` may require `projectId` for issue links — verify it uses `issue_identifier` (includes project prefix) rather than building URLs with projectId
  - Mitigation: If table builds project-specific URLs, make `projectId` column clickable to navigate to project issue
- **Low**: Making `projectId` optional may break TypeScript in existing call sites — verify callers still pass it

---

## Red Team Findings — Phase 03

### Finding RT-10 (High): `TimesheetTable` uses `row.project_id` not prop — plan claim is wrong

- **Severity:** High
- **Location:** Phase 03, section "TimesheetGrid — add `defaultCrossWorkspace` prop"
- **Flaw:** Plan claims `projectId ?? ""` passed to `TimesheetTable` gives "graceful fallback for links" — incorrect. `TimesheetTable` constructs issue URLs via `row.project_id` (from row data), NOT the `projectId` prop. The prop does not control link construction.
- **Fix:** Verify what `projectId` prop actually controls in `TimesheetTable` before claiming it affects links. Do not assume.
- **Status:** Investigate `TimesheetTable` source before Phase 03 implementation.

### Finding RT-11 (High): `MemberDropdown` receives `undefined` in cross-workspace mode

- **Severity:** High
- **Location:** Phase 03, section "CapacityDashboard — add `defaultCrossWorkspace` prop"
- **Flaw:** Making `projectId` optional but only hiding `MemberDropdown` visually is insufficient — the component still receives `projectId={undefined}` at runtime which may cause query errors or wrong data.
- **Fix:** Conditionally exclude `MemberDropdown` from render entirely when `!projectId && isCrossWorkspace` — not just CSS hide.
- **Status:** Apply in Phase 03.

### Finding RT-12 (High): `projectId` optional type change — call site audit missing

- **Severity:** High
- **Location:** Phase 03, section "TimesheetGrid" and "CapacityDashboard"
- **Flaw:** TypeScript makes `projectId` optional — existing callers may accidentally omit it at runtime. No audit of existing call sites in the plan.
- **Fix:** Audit all existing call sites of `TimesheetGrid` and `CapacityDashboard` in Phase 03. Add runtime guard that throws if neither `projectId` nor `defaultCrossWorkspace` is provided.
- **Status:** Add audit step to Phase 03.

### Finding RT-13 (Medium): AnalyticsTimesheetTable issue links break at workspace scope

- **Severity:** Medium
- **Location:** Phase 03, section "Risk Assessment"
- **Flaw:** Clicking issue identifier in workspace analytics may navigate to wrong URL (empty projectId in path or root-level issue).
- **Fix:** Specify exact link target for workspace-scoped rows — likely `/:ws/projects/:projectId/issues/:issueId` using `row.project_id`.
- **Status:** Add specification to Phase 03.

### Finding RT-14 (Medium): No loading/error state in `WorkspaceAnalyticsTimesheetGrid`

- **Severity:** Medium
- **Location:** Phase 03, section "WorkspaceAnalyticsTimesheetGrid (NEW)"
- **Flaw:** Component spec doesn't describe loading skeleton or error UI. Existing components presumably have patterns to follow.
- **Fix:** Copy error handling pattern from `AnalyticsTimesheetGrid`. Use `isWorkspaceAnalyticsTimesheetLoading` for skeleton, `workspaceAnalyticsTimesheetError` (from RT-9 fix) for error display.
- **Status:** Add to Phase 03 implementation steps.

### Finding RT-15 (Medium): Tab key `project_analytics` vs existing `analytics` mismatch

- **Severity:** Medium
- **Location:** Phase 04, section "Key Insights" (flagged in Phase 03 context)
- **Flaw:** Phase 04 says reuse keys `my_timesheet`, `project_analytics`, `capacity` but project time-tracking uses `analytics` not `project_analytics`.
- **Fix:** Use `analytics` as tab key to match existing project time-tracking.
- **Status:** Fix in Phase 04.
