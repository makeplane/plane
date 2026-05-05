# Phase 11: Frontend Comparison View

## Context Links

- [Parent Plan](./plan.md)
- [Phase 8: Backend Comparison API](./phase-08-backend-comparison-reports-apis.md)
- [Phase 9: Tab Navigation + Workspaces](./phase-09-frontend-tab-navigation-workspace-drilldown.md)
- Head office store: `apps/web/ce/store/head-office.store.ts`
- Head office service: `apps/web/ce/services/head-office.service.ts`
- Propel AreaChart: `packages/propel/src/charts/area-chart/`
- recharts: `apps/web/package.json` (^2.15.1)

## Overview

- **Priority:** P2
- **Status:** pending
- **Effort:** 3h
- **Description:** Build comparison view within the Workspaces tab. When 2-3 workspaces are selected via compare checkboxes (Phase 9), show side-by-side metrics table and 30-day completion trend overlay using Propel AreaChart.

## Key Insights

- Compare mode toggle in Phase 9's workspace cards — this phase renders the comparison result
- Propel AreaChart: `import { AreaChart } from "@plane/propel/charts/area-chart"` with props: data, areas, xAxis, yAxis, legend, showTooltip
- Each area in the chart represents one workspace's completion trend
- Metrics table: simple HTML table with workspace columns
- Triggered by "Compare Selected" button in workspace cards (Phase 9)
- Comparison state stored in store: `comparisonData`, `isComparisonLoading`

## Requirements

### Functional

1. Comparison view replaces workspace cards when active (toggle between list and compare)
2. Side-by-side metrics table: rows = metric names, columns = workspace names
3. 30-day trend chart: AreaChart with one area per workspace, overlaid
4. "Back to list" button to exit comparison mode
5. Workspace names as column headers with color coding matching chart areas

### Non-Functional

1. Chart responsive to container width
2. Smooth transition between list and comparison views
3. Max 3 workspaces (enforced in Phase 9 selection)

## Architecture

```
Workspaces tab (when compare active):
  -> HeadOfficeComparisonView
       -> "Back to list" button
       -> HeadOfficeComparisonTable (metrics side-by-side)
       -> HeadOfficeComparisonChart (AreaChart trend overlay)

Store additions:
  comparisonData: { workspaces: Record, daily_trend: [] } | null
  isComparisonLoading: boolean
  isCompareActive: boolean
  fetchComparison(slug, workspaceIds[]): action
  exitComparison(): action
```

## Related Code Files

### Files to Create

- `apps/web/core/components/head-office/head-office-comparison-view.tsx` — Container
- `apps/web/core/components/head-office/head-office-comparison-table.tsx` — Metrics table
- `apps/web/core/components/head-office/head-office-comparison-chart.tsx` — Trend AreaChart

### Files to Modify

<!-- Updated: Validation Session 2 - comparison state in workspaces store -->

- `apps/web/ce/store/head-office-workspaces.store.ts` — Add comparison state + actions (same store as Phase 9)
- `apps/web/ce/services/head-office.service.ts` — Add fetchComparison method
- `apps/web/core/components/head-office/head-office-workspace-cards.tsx` — Conditionally render comparison view

## Implementation Steps

### Step 1: Extend service with comparison method (0.25h)

1. Add interface:
   ```typescript
   export interface IComparisonData {
     workspaces: Record<
       string,
       {
         workspace: { id: string; name: string; slug: string };
         total_projects: number;
         open_issues: number;
         closed_issues_30d: number;
         completion_rate: number;
         active_members: number;
         active_cycles: number;
       }
     >;
     daily_trend: Array<{
       date: string;
       [workspaceId: string]: number | string; // ws_id keys = completed count
     }>;
   }
   ```
2. Add method:
   ```typescript
   async fetchComparison(slug: string, workspaceIds: string[]): Promise<IComparisonData> {
     return this.get(`/api/v1/workspaces/${slug}/head-office/compare/`, {
       params: { workspace_ids: workspaceIds.join(",") }
     }).then(r => r?.data);
   }
   ```

### Step 2: Extend store with comparison state (0.5h)

1. Add observables:
   ```typescript
   comparisonData: IComparisonData | null = null;
   isComparisonLoading: boolean = false;
   isCompareActive: boolean = false;
   ```
2. Add actions:

   ```typescript
   fetchComparison = async (slug: string) => {
     this.isComparisonLoading = true;
     this.isCompareActive = true;
     try {
       const data = await this.service.fetchComparison(slug, this.selectedCompareIds);
       runInAction(() => {
         this.comparisonData = data;
       });
     } catch (error) {
       console.error("Failed to fetch comparison", error);
     } finally {
       runInAction(() => {
         this.isComparisonLoading = false;
       });
     }
   };

   exitComparison = () => {
     this.isCompareActive = false;
     this.comparisonData = null;
     this.selectedCompareIds = [];
   };
   ```

### Step 3: Create Comparison View container (0.5h)

1. `head-office-comparison-view.tsx` (~50 lines):

   ```typescript
   export const HeadOfficeComparisonView = observer(() => {
     const { headOffice } = useStore();

     if (headOffice.isComparisonLoading) return <Spinner />;
     if (!headOffice.comparisonData) return null;

     return (
       <div className="flex flex-col gap-6">
         <div className="flex items-center justify-between">
           <h3 className="text-lg font-medium">Workspace Comparison</h3>
           <button onClick={() => headOffice.exitComparison()} className="text-sm text-primary hover:underline">
             Back to list
           </button>
         </div>
         <HeadOfficeComparisonTable />
         <HeadOfficeComparisonChart />
       </div>
     );
   });
   ```

### Step 4: Create Comparison Table (0.75h)

1. `head-office-comparison-table.tsx` (~100 lines):
   - Header row: "Metric" | workspace1.name | workspace2.name | workspace3.name
   - Metric rows:
     - Total Projects
     - Open Issues
     - Closed Issues (30d)
     - Completion Rate (% with color coding)
     - Active Members
     - Active Cycles
   - Color-coded workspace headers matching chart area colors
   - Highlight best/worst values per metric (bold green for best, red for worst)

### Step 5: Create Comparison Chart (1h)

1. `head-office-comparison-chart.tsx` (~90 lines):

   ```typescript
   import { AreaChart } from "@plane/propel/charts/area-chart";

   const WORKSPACE_COLORS = ["#3b82f6", "#10b981", "#f59e0b"]; // blue, green, amber

   export const HeadOfficeComparisonChart = observer(() => {
     const { headOffice } = useStore();
     const { comparisonData } = headOffice;
     if (!comparisonData) return null;

     const workspaceEntries = Object.entries(comparisonData.workspaces);

     const areas = workspaceEntries.map(([wsId, ws], idx) => ({
       dataKey: wsId,
       name: ws.workspace.name,
       color: WORKSPACE_COLORS[idx],
       fillOpacity: 0.1,
     }));

     return (
       <div className="rounded-lg border border-subtle bg-surface-1 p-4">
         <h4 className="mb-4 text-sm font-medium">30-Day Completion Trend</h4>
         <AreaChart
           data={comparisonData.daily_trend}
           areas={areas}
           xAxis={{ dataKey: "date", tickFormatter: formatDate }}
           yAxis={{ label: "Completed Issues" }}
           legend
           showTooltip
         />
       </div>
     );
   });
   ```

   - Format date ticks as "Mar 1", "Mar 2" etc.
   - Chart height: 300px

### Step 6: Wire up in workspace cards (0.25h)

1. In `head-office-workspace-cards.tsx`:
   - If `headOffice.isCompareActive`: render `<HeadOfficeComparisonView />` instead of accordion
   - "Compare Selected" button: calls `headOffice.fetchComparison(workspaceSlug)`
   - Button disabled if `selectedCompareIds.length < 2`

## Todo List

- [ ] Add comparison interface + method to HeadOfficeService
- [ ] Add comparison observables + actions to HeadOfficeStore
- [ ] Create `head-office-comparison-view.tsx` container
- [ ] Create `head-office-comparison-table.tsx` metrics table
- [ ] Create `head-office-comparison-chart.tsx` AreaChart
- [ ] Wire comparison view in `head-office-workspace-cards.tsx`
- [ ] Test: compare 2 workspaces shows correct metrics
- [ ] Test: compare 3 workspaces shows all 3 areas in chart
- [ ] Test: "Back to list" exits comparison mode
- [ ] Test: chart renders 30 data points with correct workspace colors
- [ ] Verify all components <150 lines

## Success Criteria

- Selecting 2-3 workspaces and clicking "Compare" fetches comparison data
- Metrics table shows side-by-side values for all workspace metrics
- AreaChart renders 30-day trend with one area per workspace
- "Back to list" returns to workspace card view
- Chart is responsive to container width
- All components use `observer()`, <150 lines each

## Risk Assessment

| Risk                          | Probability | Impact | Mitigation                                               |
| ----------------------------- | ----------- | ------ | -------------------------------------------------------- |
| Propel AreaChart API mismatch | Medium      | Medium | Verify import path + props against Propel source         |
| Chart data format mismatch    | Medium      | Medium | Transform daily_trend to match AreaChart expected format |
| Missing dates in trend data   | Medium      | Low    | Backend fills missing dates with 0                       |
| Color accessibility           | Low         | Low    | Use distinguishable colors + legend labels               |

## Security Considerations

- Comparison data from scope-validated backend API
- No additional security surface beyond Phase 9 workspace selection
- Chart rendering is client-side only (no data sent externally)

## Next Steps

- Phase 12: Reports tab with PDF export
- Consider adding export comparison as PDF (via Phase 8 comparison report type)
