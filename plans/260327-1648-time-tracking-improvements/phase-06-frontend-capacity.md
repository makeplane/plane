# Phase 06 — Frontend: Capacity Tab Improvements

**Status:** Todo | **Priority:** High | **Effort:** L

## Overview

Three changes to the Capacity tab:

1. Replace hardcoded pie chart "Category Distribution" with 2 real count tables (Main Task / Sub Task)
2. Make heatmap cells clickable → popover listing tasks for that member/day
3. Fix capacity formula if needed (currently: >480min=overloaded, 420-480=normal, <420=under — verify with team)

## Files to Modify

- `apps/web/ce/components/time-tracking/capacity/capacity-summary-cards.tsx` — replace pie with 2 tables
- `apps/web/ce/components/time-tracking/capacity/capacity-heatmap.tsx` — add clickable cells
- `apps/web/ce/components/time-tracking/capacity/capacity-dashboard.tsx` — fetch categories data + wire day-details

## Files to Create

- `apps/web/ce/components/time-tracking/capacity/capacity-day-details-popover.tsx`
- `apps/web/ce/components/time-tracking/capacity/category-count-table.tsx`

## New Types Needed

Add to `packages/types/src/worklog.ts`:

```typescript
export interface ICategoryCount {
  name: string;
  count: number;
}

export interface ICapacityCategoriesResponse {
  main_task_categories: ICategoryCount[];
  sub_task_categories: ICategoryCount[];
}

export interface ICapacityDayTask {
  issue_id: string;
  issue_name: string;
  issue_identifier: string;
  total_minutes: number;
}

export interface ICapacityDayDetailsResponse {
  tasks: ICapacityDayTask[];
}
```

## Implementation Steps

### 1. Service methods (add to CE worklog service)

```typescript
async getCapacityCategories(
  workspaceSlug: string,
  projectId: string,
  params?: { date_from?: string; date_to?: string; member_id?: string }
): Promise<ICapacityCategoriesResponse> {
  return this.get(
    `/api/workspaces/${workspaceSlug}/projects/${projectId}/time-tracking/capacity/categories/`,
    { params }
  );
}

async getCapacityDayDetails(
  workspaceSlug: string,
  projectId: string,
  memberId: string,
  date: string
): Promise<ICapacityDayDetailsResponse> {
  return this.get(
    `/api/workspaces/${workspaceSlug}/projects/${projectId}/time-tracking/capacity/day-details/`,
    { params: { member_id: memberId, date } }
  );
}
```

### 2. Store additions (worklog store)

```typescript
categoriesData: ICapacityCategoriesResponse | null = null;

fetchCapacityCategories = async (workspaceSlug: string, projectId: string, params?) => {
  const data = await this.worklogService.getCapacityCategories(workspaceSlug, projectId, params);
  runInAction(() => { this.categoriesData = data; });
};

// Day details: fetch on-demand (not stored globally — too granular)
fetchCapacityDayDetails = async (
  workspaceSlug: string, projectId: string, memberId: string, date: string
): Promise<ICapacityDayDetailsResponse> => {
  return this.worklogService.getCapacityDayDetails(workspaceSlug, projectId, memberId, date);
};
```

### 3. `category-count-table.tsx`

Simple table: name | count, no editing, no chart.

```tsx
interface CategoryCountTableProps {
  title: string;
  categories: ICategoryCount[];
  isLoading?: boolean;
}

export const CategoryCountTable: FC<CategoryCountTableProps> = ({ title, categories, isLoading }) => {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-subtle bg-surface-1 p-4">
      <span className="text-12 font-medium tracking-wide uppercase text-tertiary">{title}</span>
      {isLoading ? (
        <div className="py-4 text-center text-12 text-tertiary animate-pulse">{t("common.loading")}</div>
      ) : categories.length === 0 ? (
        <div className="py-4 text-center text-12 text-tertiary">{t("capacity_no_data")}</div>
      ) : (
        <div className="flex flex-col divide-y divide-subtle">
          {categories.map((cat) => (
            <div key={cat.name} className="flex items-center justify-between py-2">
              <span className="text-13 text-primary truncate">{cat.name}</span>
              <span className="text-13 font-semibold text-secondary">{cat.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 4. `capacity-summary-cards.tsx` — Replace pie chart with 2 category tables

Remove: `recharts` imports, `PieChart`, `pieData`, `COLORS`, all pie-related JSX.

Replace the category distribution card section with:

```tsx
interface ICapacitySummaryCardsProps {
  totalLoggedMinutes: number;
  categoriesData: ICapacityCategoriesResponse | null;
  isCategoriesLoading?: boolean;
}

export const CapacitySummaryCards = observer((props: ICapacitySummaryCardsProps) => {
  const { totalLoggedMinutes, categoriesData, isCategoriesLoading } = props;
  const { t } = useTranslation();
  const formatHours = (minutes: number) => (minutes / 60).toFixed(1);

  return (
    <div className="flex flex-col gap-4 mb-8">
      {/* Total Hours card */}
      <div className="rounded-xl border border-subtle bg-surface-1 p-4 w-48">
        <span className="text-12 tracking-wide font-medium uppercase text-tertiary">{t("capacity_total_logged")}</span>
        <span className="text-2xl font-bold text-primary mt-2 block">
          {formatHours(totalLoggedMinutes)}
          <span className="text-13 font-medium text-secondary ml-0.5">h</span>
        </span>
      </div>

      {/* 2 category tables side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CategoryCountTable
          title={t("capacity_main_task_category")}
          categories={categoriesData?.main_task_categories ?? []}
          isLoading={isCategoriesLoading}
        />
        <CategoryCountTable
          title={t("capacity_sub_task_category")}
          categories={categoriesData?.sub_task_categories ?? []}
          isLoading={isCategoriesLoading}
        />
      </div>
    </div>
  );
});
```

### 5. `capacity-day-details-popover.tsx`

Triggered when clicking a heatmap cell. Fetches on open (not pre-fetched).

```tsx
interface CapacityDayDetailsPopoverProps {
  memberId: string;
  date: string;
  loggedMinutes: number;
  workspaceSlug: string;
  projectId: string;
  cellClassName: string;
  cellLabel: string;
}

export const CapacityDayDetailsPopover: FC<CapacityDayDetailsPopoverProps> = (props) => {
  const { memberId, date, loggedMinutes, workspaceSlug, projectId, cellClassName, cellLabel } = props;
  const worklogStore = useWorklog();
  const [tasks, setTasks] = useState<ICapacityDayTask[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpen = async () => {
    if (loggedMinutes === 0) return;
    setIsLoading(true);
    try {
      const res = await worklogStore.fetchCapacityDayDetails(workspaceSlug, projectId, memberId, date);
      setTasks(res.tasks);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover
      onOpenChange={(open) => {
        if (open) void handleOpen();
      }}
    >
      <Popover.Button
        className={`mx-auto flex h-8 w-[50px] items-center justify-center rounded-md border shadow-sm transition-all hover:scale-[1.15] hover:shadow-md cursor-pointer ${cellClassName} font-medium text-12`}
      >
        {cellLabel}
      </Popover.Button>
      <Popover.Panel className="z-30 w-64 rounded-lg border border-subtle bg-surface-1 shadow-lg p-2 max-h-60 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="py-4 text-center text-12 text-tertiary animate-pulse">{t("common.loading")}</div>
        ) : tasks && tasks.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {tasks.map((task) => (
              <div
                key={task.issue_id}
                className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-surface-2"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-11 font-mono text-tertiary shrink-0">{task.issue_identifier}</span>
                  <span className="text-12 text-primary truncate">{task.issue_name}</span>
                </div>
                <span className="text-12 font-medium text-secondary shrink-0">{formatMinutes(task.total_minutes)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-12 text-tertiary">{t("capacity_no_data")}</div>
        )}
      </Popover.Panel>
    </Popover>
  );
};
```

### 6. `capacity-heatmap.tsx` — Use `CapacityDayDetailsPopover` for cells

Replace the inline `<div>` cell with `<CapacityDayDetailsPopover>`:

```tsx
// Before (plain div):
<div className={`mx-auto flex h-8 w-[50px] ... ${cellInfo.className}`}>
  {cellVal}
</div>

// After (popover):
<CapacityDayDetailsPopover
  memberId={member.member_id}
  date={dateStr}
  loggedMinutes={loggedMinutes}
  workspaceSlug={workspaceSlug}
  projectId={projectId}
  cellClassName={cellInfo.className}
  cellLabel={cellVal}
/>
```

Pass `workspaceSlug` and `projectId` down as props to `CapacityHeatmap`.

### 7. `capacity-dashboard.tsx` — Wire categories fetch

```tsx
// On mount and when date range changes, also fetch categories
useEffect(() => {
  void worklogStore.fetchCapacityCategories(workspaceSlug, projectId, {
    date_from: dateFrom,
    date_to: dateTo,
  });
}, [workspaceSlug, projectId, dateFrom, dateTo]);

// Pass to CapacitySummaryCards
<CapacitySummaryCards
  totalLoggedMinutes={data?.project_total_logged ?? 0}
  categoriesData={worklogStore.categoriesData}
  isCategoriesLoading={false}
/>

// Pass workspaceSlug + projectId to CapacityHeatmap
<CapacityHeatmap
  members={data?.members ?? []}
  dateFrom={dateFrom}
  dateTo={dateTo}
  projectDailyTotals={data?.project_daily_totals}
  workspaceSlug={workspaceSlug}
  projectId={projectId}
/>
```

## i18n Keys to Add

```ts
capacity_main_task_category: "Main Task Category",
capacity_sub_task_category: "Sub Task Category",
capacity_day_details: "Tasks on this day",
```

## File Size Check

- `capacity-summary-cards.tsx`: 86 lines → removing recharts → ~55 lines ✓
- `capacity-heatmap.tsx`: 153 lines → replacing inner div with popover component → ~130 lines ✓
- `capacity-day-details-popover.tsx`: ~75 lines ✓
- `category-count-table.tsx`: ~50 lines ✓

## Success Criteria

- Category distribution shows 2 tables (Main Task / Sub Task) with real label counts
- Capacity heatmap cells are clickable — clicking a cell with data shows task list popover
- Popover lists tasks with identifier, name, hours logged on that specific day
- Cells with 0 minutes are not clickable (or popover is empty)
- MEMBER role users can access capacity dashboard (backend permission fix in Phase 02)
- `pnpm check:lint` passes
