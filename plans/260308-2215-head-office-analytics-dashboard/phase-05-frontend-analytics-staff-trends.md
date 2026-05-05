# Phase 5: Frontend Analytics - Staff & Trends (P2)

## Context Links

- [Parent Plan](./plan.md)
- [Phase 2: Backend Staff Analytics API](./phase-02-backend-activity-analytics-apis.md)
- [Phase 3: Frontend Page Structure](./phase-03-frontend-mvp-page-summary.md)
- HeadOfficeStore: `apps/web/ce/store/head-office.store.ts`
- HeadOfficeService: `apps/web/ce/services/head-office.service.ts`
- Head Office page: `apps/web/app/(all)/[workspaceSlug]/(projects)/head-office/page.tsx`

## Overview

- **Priority:** P2 (deferrable)
- **Status:** pending
- **Effort:** 4h
- **Description:** Add staff analytics section to Head Office: headcount by department bar chart, new/departed staff stats, and trend indicators on summary cards. This phase is optional for MVP launch.

## Key Insights

- Backend staff-analytics endpoint returns `by_department` array (managers only) + aggregate totals.
- Non-managers see only totals -- UI must handle both cases (show chart only for managers).
- recharts ^2.15.1 already in codebase (apps/web dependency). Use recharts BarChart for department headcount.
<!-- Updated: Validation Session 1 - use recharts (already available), not CSS-only -->
- Trend indicators: compare current values with previous period (requires backend support or client-side computation). For MVP, show static values without trend arrows -- add trends in future iteration.

## Requirements

### Functional

1. Staff analytics section below activity/cycles grid
2. Department headcount bar chart (horizontal bars, CSS-only)
3. Stats cards: Total Active, New This Month, Departed This Month
4. Graceful degradation: non-managers see only aggregate stats (no chart)

### Non-Functional

1. Use recharts (already in codebase) for charts
<!-- Updated: Validation Session 1 - recharts instead of CSS-only -->
2. Components <150 lines
3. Responsive: full-width section

## Architecture

```
HeadOfficePage
  -> ... (existing Phase 3-4 components)
  -> HeadOfficeStaffAnalytics
       -> HeadOfficeStaffStats (3 stat cards)
       -> HeadOfficeDepartmentChart (horizontal bar chart, managers only)
```

## Related Code Files

### Files to Create

- `apps/web/core/components/head-office/head-office-staff-analytics.tsx`
- `apps/web/core/components/head-office/head-office-staff-stats.tsx`
- `apps/web/core/components/head-office/head-office-department-chart.tsx`

### Files to Modify

- `apps/web/ce/store/head-office.store.ts` -- Add staffAnalytics observable and fetch action
- `apps/web/app/(all)/[workspaceSlug]/(projects)/head-office/page.tsx` -- Add staff analytics section

## Implementation Steps

### Step 1: Extend Store with Staff Analytics (0.5h)

1. Add types to service:

   ```typescript
   export interface IHeadOfficeDeptStat {
     dept_id: string;
     dept_name: string;
     dept_code: string;
     count: number;
     new_30d: number;
     departed_30d: number;
   }

   export interface IHeadOfficeStaffAnalytics {
     by_department: IHeadOfficeDeptStat[] | null; // null for non-managers
     total_active: number;
     new_this_month: number;
     departed_this_month: number;
   }
   ```

2. Extend store:

   ```typescript
   staffAnalytics: IHeadOfficeStaffAnalytics | null = null;
   isStaffLoading = false;

   // makeObservable additions:
   staffAnalytics: observable,
   isStaffLoading: observable,
   fetchStaffAnalytics: action,
   ```

3. Add fetch method following same pattern as other fetches.

### Step 2: Create Staff Stats Component (0.5h)

1. `head-office-staff-stats.tsx` (~60 lines):
   - `observer()` wrapper
   - 3 stat cards in a row:
     - Total Active Staff (Users icon, primary color)
     - New This Month (UserPlus icon, green)
     - Departed This Month (UserMinus icon, orange/red)
   - Each card: icon + label + number value
   - Responsive: 3 cols desktop, 1 col mobile
   - Loading: skeleton cards

### Step 3: Create Department Chart Component (1.5h)

1. `head-office-department-chart.tsx` (~120 lines):
   - `observer()` wrapper
   - Props: `departments: IHeadOfficeDeptStat[]`
   - Horizontal bar chart using recharts BarChart:
     <!-- Updated: Validation Session 1 - recharts BarChart instead of CSS-only -->

     ```tsx
     import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

     <ResponsiveContainer width="100%" height={departments.length * 40 + 40}>
       <BarChart data={sortedDepts} layout="vertical" margin={{ left: 60 }}>
         <XAxis type="number" />
         <YAxis type="category" dataKey="dept_code" width={60} />
         <Tooltip />
         <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
       </BarChart>
     </ResponsiveContainer>;
     ```

   - Sort departments by count descending
   - Max bar width calculated from max count value
   - Show dept code as label (truncate if long), count on right
   - Tooltip on hover: full dept name + breakdown (new/departed)
   - Empty: "No department data available" (non-manager case)

### Step 4: Create Staff Analytics Container (0.5h)

1. `head-office-staff-analytics.tsx` (~60 lines):
   - `observer()` wrapper
   - Section header: "Staff Analytics" with Users icon
   - Render `<HeadOfficeStaffStats />`
   - Conditionally render `<HeadOfficeDepartmentChart />` if `by_department` is not null
   - Container: `bg-surface-1 rounded-lg border border-subtle p-4 mt-6`

### Step 5: Update Page (0.5h)

1. Update `head-office/page.tsx`:
   - Add `fetchStaffAnalytics` to useEffect
   - Add `<HeadOfficeStaffAnalytics />` below the activity/cycles grid
   - Verify page stays under line limit; extract section wrappers if needed

### Step 6: Verify & Polish (0.5h)

1. Verify non-manager view: only stats cards, no chart
2. Verify manager view: stats + chart
3. Check responsive layout on different screen sizes
4. Ensure loading states are consistent with other sections

## Todo List

- [ ] Add staff analytics types to service file
- [ ] Extend store with staffAnalytics observable and fetch action
- [ ] Create `head-office-staff-stats.tsx` (3 stat cards)
- [ ] Create `head-office-department-chart.tsx` (CSS horizontal bars)
- [ ] Create `head-office-staff-analytics.tsx` (container)
- [ ] Update page to fetch and render staff analytics
- [ ] Verify non-manager view shows only aggregates
- [ ] Verify manager view shows department chart
- [ ] Test responsive layout

## Success Criteria

- Staff stats section shows 3 aggregate cards (active, new, departed)
- Department chart renders horizontal bars for managers
- Non-managers see only aggregate stats (no chart, no per-dept breakdown)
- Uses recharts BarChart (already in codebase, no new dependency)
- All components under 150 lines
- Loading and empty states work correctly

## Risk Assessment

| Risk                                    | Probability | Impact | Mitigation                                      |
| --------------------------------------- | ----------- | ------ | ----------------------------------------------- |
| Many departments overflow chart         | Medium      | Low    | Scrollable container, show top 10 with "others" |
| CSS bars inconsistent across browsers   | Low         | Low    | Use standard flexbox, no exotic properties      |
| Non-manager receives by_department=null | Expected    | None   | Handled by conditional render                   |

## Security Considerations

- Department headcount data visible only to managers (backend enforced)
- No individual staff PII shown in chart (only counts per department)
- Frontend checks `by_department !== null` before rendering chart

## Next Steps

- Future: add trend arrows comparing to previous period (requires backend support)
- Future: activity heatmap (7-day grid showing activity density)
- Future: export dashboard as PDF/image
