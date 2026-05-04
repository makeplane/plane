# Phase 04: Frontend refactor — gộp Today + Overdue, dùng endpoint mới

**Priority:** P0 | **Status:** TODO | **Effort:** 1-1.5 giờ | **Owner:** frontend dev

## Goal

- Replace 2 components (`today-work-items.tsx`, `overdue-work-items.tsx`) bằng 1 component shared `work-items-section.tsx` nhận prop `period`.
- Dùng endpoint mới `/api/users/me/work-items/?period=today|overdue` thay vì loop 50 workspaces.

## Files

**Create:**
- `apps/web/ce/components/profile/work-items-section.tsx` — shared component
- `apps/web/core/services/user-work-items.service.ts` — service mới

**Modify:**
- `apps/web/app/(all)/[workspaceSlug]/(projects)/profile/[userId]/page.tsx` — render `WorkItemsSection` 2 lần với prop `period`
- `apps/web/ce/components/profile/work-items-table.tsx` — adjust enrich props nếu cần

**Delete (sau Phase 05 verify):**
- `apps/web/ce/components/profile/today-work-items.tsx`
- `apps/web/ce/components/profile/overdue-work-items.tsx`

**Reference:**
- Logic spec: [phase-01](phase-01-design-spec.md)

## Implementation

### 1. Service mới

```ts
// apps/web/core/services/user-work-items.service.ts
import { APIService } from "./api.service";

export type WorkItemPeriod = "today" | "overdue";

export type WorkItem = {
  id: string;
  name: string;
  sequence_id: number;
  project_id: string | null;
  state_id: string | null;
  workspace_id: string;
  main_task_category_id: string | null;
  sub_task_category_id: string | null;
  start_date: string | null;
  target_date: string | null;
  assignee_ids: string[];
  label_ids: string[];
  module_ids: string[];
  cycle_id: string | null;
  link_count: number;
  attachment_count: number;
  sub_issues_count: number;
  total_logged_minutes: number;
};

export type WorkItemLookups = {
  workspaces: Record<string, { id: string; slug: string; name: string }>;
  projects: Record<string, { id: string; name: string; identifier: string }>;
  states: Record<string, { id: string; name: string; color: string; group: string }>;
  categories: {
    main: Record<string, { id: string; name: string }>;
    sub: Record<string, { id: string; name: string }>;
  };
};

export type WorkItemsTimelineResponse = {
  items: WorkItem[];
  lookups: WorkItemLookups;
  meta: { total: number; capped: boolean; cache_hit: boolean };
};

export class UserWorkItemsService extends APIService {
  async getTimeline(params: {
    period: WorkItemPeriod;
    workspaceSlug?: string;
  }): Promise<WorkItemsTimelineResponse> {
    return this.get(`/api/users/me/work-items/`, { params })
      .then((r) => r?.data)
      .catch((e) => {
        throw e?.response?.data;
      });
  }
}
```

### 2. Shared component

```tsx
// apps/web/ce/components/profile/work-items-section.tsx
"use client";

import { useState, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Download } from "lucide-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Switch } from "@plane/propel/switch";
import { Card } from "@plane/ui";
import { cn } from "@plane/utils";
// ce imports
import {
  WorkItemsTable,
  type EnrichedIssue,
} from "@/plane-web/components/profile/work-items-table";
import { exportWorkItemsXLSX } from "./export-work-items";
// services
import { UserWorkItemsService, type WorkItemPeriod } from "@/services/user-work-items.service";

const workItemsService = new UserWorkItemsService();

interface Props {
  period: WorkItemPeriod;
}

export const WorkItemsSection = observer(function WorkItemsSection({ period }: Props) {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const [crossWorkspaces, setCrossWorkspaces] = useState(true);

  const todayStr = new Date().toISOString().split("T")[0];
  const swrKey = `WORK_ITEMS_${period}_${crossWorkspaces ? "ALL" : workspaceSlug}_${todayStr}`;

  const { data, isLoading } = useSWR(
    swrKey,
    () =>
      workItemsService.getTimeline({
        period,
        workspaceSlug: crossWorkspaces ? undefined : workspaceSlug?.toString(),
      }),
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // Enrich items with lookups (O(1) hash lookup)
  const issueList: EnrichedIssue[] = useMemo(() => {
    if (!data) return [];
    const { items, lookups } = data;
    return items.map((item) => ({
      ...item,
      _workspaceSlug: lookups.workspaces[item.workspace_id]?.slug ?? "",
      _workspaceName: lookups.workspaces[item.workspace_id]?.name ?? "",
      _project: item.project_id ? lookups.projects[item.project_id] : undefined,
      _state: item.state_id ? lookups.states[item.state_id] : undefined,
      _mainCategoryName: item.main_task_category_id
        ? lookups.categories.main[item.main_task_category_id]?.name
        : undefined,
      _subCategoryName: item.sub_task_category_id
        ? lookups.categories.sub[item.sub_task_category_id]?.name
        : undefined,
    }));
  }, [data]);

  const isDataReady = !isLoading && data !== undefined;
  const titleKey =
    period === "today" ? "profile.stats.today_work_items.title" : "profile.stats.overdue_work_items.title";
  const crossKey =
    period === "today"
      ? "profile.stats.today_work_items.cross_workspaces"
      : "profile.stats.overdue_work_items.cross_workspaces";
  const exportFilename = `${period}-work-items-${todayStr}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-16 font-medium">{t(titleKey)}</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-13 text-secondary">{t(crossKey)}</span>
            <Switch value={crossWorkspaces} onChange={setCrossWorkspaces} size="sm" />
          </div>
          <div className="border-l border-subtle h-4" />
          <button
            type="button"
            onClick={() => exportWorkItemsXLSX(issueList, exportFilename)}
            disabled={!isDataReady || issueList.length === 0}
            className={cn(
              "flex items-center gap-1 text-13 text-secondary hover:text-primary transition-colors",
              (!isDataReady || issueList.length === 0) && "opacity-40 cursor-not-allowed"
            )}
          >
            <Download className="h-3.5 w-3.5" />
            {t("export")}
          </button>
        </div>
      </div>
      {data?.meta.capped && (
        <p className="text-12 text-warning-secondary">
          {t("profile.work_items.capped_warning", { defaultValue: "Showing first 500 items only." })}
        </p>
      )}
      <Card className="p-2">
        <WorkItemsTable issues={issueList} isLoading={!isDataReady} i18nNs={`${period}_work_items`} />
      </Card>
    </div>
  );
});
```

### 3. Update page.tsx

```tsx
// apps/web/app/(all)/[workspaceSlug]/(projects)/profile/[userId]/page.tsx
// Replace:
// import { TodayWorkItems } from "@/plane-web/components/profile/today-work-items";
// import { OverdueWorkItems } from "@/plane-web/components/profile/overdue-work-items";
// With:
import { WorkItemsSection } from "@/plane-web/components/profile/work-items-section";

// Replace JSX:
// <TodayWorkItems />
// <OverdueWorkItems />
// With:
<WorkItemsSection period="today" />
<WorkItemsSection period="overdue" />
```

### 4. (Optional) Add i18n key for capped warning

`packages/i18n/src/locales/en/translations.ts`:
```ts
profile: {
  work_items: {
    capped_warning: "Showing first 500 items only.",
  },
}
```
+ `vi/`, `ko/` mirrors.

## Logic preservation checklist

| Logic cũ | Logic mới | Verified? |
|----------|-----------|-----------|
| Filter `assignees=user` | BE filter same | ✅ spec |
| State group `backlog,unstarted,started` | BE filter same | ✅ spec |
| Today: `start_date <= today OR null` | BE filter same | ✅ spec |
| Overdue: `target_date < today AND not null` | BE filter `__lt` (skip null) | ✅ spec |
| Order by `target_date` | BE same | ✅ spec |
| crossWorkspaces=true → all member ws | BE default behavior | ✅ spec |
| crossWorkspaces=false → current ws only | Pass `workspace_slug` query | ✅ spec |
| Enrich workspace/project/state name | Lookups response | ✅ spec |
| Enrich category name (BUG fix) | Lookups response | ✅ FIXED |
| Sort + filter trong WorkItemsTable | Component không thay đổi | ✅ |
| Export XLSX button | Reuse `exportWorkItemsXLSX` | ✅ |
| Pagination 10/page | WorkItemsTable không thay đổi | ✅ |

## Acceptance criteria Phase 04

- [ ] `WorkItemsSection period="today"` render giống TodayWorkItems cũ
- [ ] `WorkItemsSection period="overdue"` render giống OverdueWorkItems cũ
- [ ] Cross-workspace toggle hoạt động
- [ ] Categories hiển thị đúng cho items cross-workspace (Bug Fix verified)
- [ ] Export XLSX vẫn hoạt động
- [ ] Network tab: 2 calls thay 300 calls
- [ ] Browser console: zero error/warning
- [ ] Lint + type check pass

## Risks

| Risk | Mitigation |
|------|-----------|
| API contract khác BE | Phase 01 lock spec + integration test trước merge |
| `useMemo` enrich miss key | Test với data thực có category | 
| BC compat: WorkItemsTable expect cũ EnrichedIssue shape | Type giữ nguyên (cùng `_project`, `_state`, ...) |

## Next

→ Phase 05 (testing + rollout + deprecate old)
