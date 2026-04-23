"use client";

import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { IState, TBaseIssue } from "@plane/types";
import { Switch } from "@plane/propel/switch";
import { Card } from "@plane/ui";
// ce imports
import {
  WorkItemsTable,
  type EnrichedIssue,
  type ProjectLookup,
  type StateLookup,
} from "@/plane-web/components/profile/work-items-table";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useTaskCategory } from "@/hooks/store/use-task-category";
// services
import { UserService } from "@/services/user.service";
import { ProjectService, ProjectStateService } from "@/services/project";

const userService = new UserService();
const projectService = new ProjectService();
const stateService = new ProjectStateService();

const EXCLUDED_STATE_GROUPS = new Set(["completed", "cancelled"]);

export const TodayWorkItems = observer(function TodayWorkItems() {
  const { workspaceSlug, userId } = useParams();
  const { t } = useTranslation();
  const { workspaces } = useWorkspace();
  const taskCategoryStore = useTaskCategory();

  const [crossWorkspaces, setCrossWorkspaces] = useState(true);

  const todayStr = new Date().toISOString().split("T")[0];

  const allWorkspaceSlugs = Object.values(workspaces ?? {}).map((ws) => ws.slug);
  const workspaceSlugsToFetch = crossWorkspaces ? allWorkspaceSlugs : workspaceSlug ? [workspaceSlug.toString()] : [];
  const sortedSlugs = [...workspaceSlugsToFetch].sort().join(",");
  const swrKey = sortedSlugs.length > 0 && userId ? `TODAY_ISSUES_${sortedSlugs}_${userId}_${todayStr}` : null;

  // Fetch categories once per workspace
  useEffect(() => {
    if (workspaceSlug) void taskCategoryStore.fetchCategories(workspaceSlug.toString());
  }, [workspaceSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: mergedIssues, isLoading } = useSWR(swrKey, async () => {
    if (!userId) return [];
    const uid = userId.toString();

    // NOTE: start_date filter REMOVED intentionally.
    // The `start_date;before_including;` format causes a 500 on the backend.
    // We instead filter by start_date on the frontend below.
    const filterParams = { assignees: uid, state_group: "backlog,unstarted,started", order_by: "target_date" };

    const results = await Promise.all(
      workspaceSlugsToFetch.map(async (slug) => {
        try {
          const ws = Object.values(workspaces ?? {}).find((w) => w.slug === slug);
          const [issuesResponse, projects, states] = await Promise.all([
            userService.getUserProfileIssues(slug.toString(), uid, filterParams),
            projectService.getProjectsLite(slug.toString()).catch(() => []),
            stateService.getWorkspaceStates(slug.toString()).catch(() => []),
          ]);

          const projectMap = new Map<string, ProjectLookup>();
          for (const p of projects) projectMap.set(p.id, { name: p.name, identifier: p.identifier });

          const stateMap = new Map<string, StateLookup>();
          for (const s of states as IState[]) stateMap.set(s.id, { name: s.name, color: s.color, group: s.group });

          const items = Array.isArray(issuesResponse?.results) ? (issuesResponse.results as TBaseIssue[]) : [];
          return items.map(
            (issue): EnrichedIssue => ({
              ...issue,
              _workspaceSlug: slug.toString(),
              _workspaceName: ws?.name ?? slug.toString(),
              _project: issue.project_id ? projectMap.get(issue.project_id) : undefined,
              _state: issue.state_id ? stateMap.get(issue.state_id) : undefined,
            })
          );
        } catch {
          return [];
        }
      })
    );
    return results.flat();
  });

  // Enrich with category names from store (observer re-renders when store updates)
  const issueList = (mergedIssues ?? [])
    .filter((issue) => {
      if (issue._state && EXCLUDED_STATE_GROUPS.has(issue._state.group)) return false;
      if (issue.start_date && issue.start_date > todayStr) return false;
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

  const isDataReady = !isLoading && mergedIssues !== undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-16 font-medium">{t("profile.stats.today_work_items.title")}</h3>
        <div className="flex items-center gap-2">
          <span className="text-13 text-secondary">{t("profile.stats.today_work_items.cross_workspaces")}</span>
          <Switch value={crossWorkspaces} onChange={setCrossWorkspaces} size="sm" />
        </div>
      </div>
      <Card className="p-2">
        <WorkItemsTable issues={issueList} isLoading={!isDataReady} i18nNs="today_work_items" />
      </Card>
    </div>
  );
});
