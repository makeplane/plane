"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Download } from "lucide-react";
import useSWRImmutable from "swr/immutable";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Switch } from "@plane/propel/switch";
import { Card } from "@plane/ui";
import { cn } from "@plane/utils";
// ce imports
import { WorkItemsTable, type EnrichedIssue } from "@/plane-web/components/profile/work-items-table";
import { exportWorkItemsXLSX } from "./export-work-items";
// hooks
import { useUser } from "@/hooks/store/user";
import { useTaskCategory } from "@/hooks/store/use-task-category";
import { useUserWorkItems } from "@/plane-web/hooks/store/use-user-work-items";

const EXCLUDED_STATE_GROUPS = new Set(["completed", "cancelled"]);

export const TodayWorkItems = observer(function TodayWorkItems() {
  const { workspaceSlug, userId } = useParams();
  const { t } = useTranslation();
  const { data: currentUser } = useUser();
  const taskCategoryStore = useTaskCategory();

  const [crossWorkspaces, setCrossWorkspaces] = useState(true);

  const todayStr = new Date().toISOString().split("T")[0];
  const uid = userId?.toString() ?? "";
  const isSelf = !!currentUser?.id && currentUser.id === uid;

  // Dedupe category fetch across Today + Overdue via SWR identity-based dedup (Phase 5)
  useSWRImmutable(workspaceSlug ? `TASK_CATEGORIES_${workspaceSlug}` : null, () =>
    taskCategoryStore.fetchCategories(workspaceSlug.toString())
  );

  const { data: rawIssues, isLoading } = useUserWorkItems("today", crossWorkspaces, workspaceSlug?.toString(), uid);
  const { data: overdueIssues, isLoading: isOverdueLoading } = useUserWorkItems(
    "overdue",
    crossWorkspaces,
    workspaceSlug?.toString(),
    uid
  );

  // Merge overdue first (all off_track from BE), then today (BE-ordered by progress rank).
  // Dedupe by id while preserving the combined backend order — no FE sort.
  const mergedById = new Map<string, (typeof rawIssues)[number]>();
  for (const issue of overdueIssues) {
    if (issue.target_date && issue.target_date < todayStr) mergedById.set(issue.id, issue);
  }
  for (const issue of rawIssues) {
    if (!mergedById.has(issue.id)) mergedById.set(issue.id, issue);
  }

  // Defensive filter + category enrichment (observer re-renders when store updates)
  const issueList = Array.from(mergedById.values())
    .filter((issue) => {
      if (issue._state && EXCLUDED_STATE_GROUPS.has(issue._state.group)) return false;
      const isOverdue = !!issue.target_date && issue.target_date < todayStr;
      if (!isOverdue && issue.start_date && issue.start_date > todayStr) return false;
      return true;
    })
    .map(
      (issue): EnrichedIssue => ({
        ...issue,
        _mainCategoryName: issue.main_task_category_id
          ? taskCategoryStore.mainCategories[issue.main_task_category_id]?.name
          : undefined,
        _subCategoryName: issue.sub_task_category_id
          ? taskCategoryStore.subCategories[issue.sub_task_category_id]?.name
          : undefined,
      })
    );

  const isDataReady = !isLoading && !isOverdueLoading;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-16 font-medium">{t("profile.stats.today_work_items.title")}</h3>
        <div className="flex items-center gap-3">
          {/* Cross-workspace toggle is only relevant for self (aggregate endpoint is /users/me/) */}
          {isSelf && (
            <div className="flex items-center gap-2">
              <span className="text-13 text-secondary">{t("profile.stats.today_work_items.cross_workspaces")}</span>
              <Switch value={crossWorkspaces} onChange={setCrossWorkspaces} size="sm" />
            </div>
          )}
          <div className="border-l border-subtle h-4" />
          <button
            type="button"
            onClick={() => exportWorkItemsXLSX(issueList, `today-work-items-${todayStr}`)}
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
      <Card className="p-2">
        <WorkItemsTable issues={issueList} isLoading={!isDataReady} i18nNs="today_work_items" />
      </Card>
    </div>
  );
});
