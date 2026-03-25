"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TBaseIssue, IState } from "@plane/types";
import { Switch } from "@plane/propel/switch";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { Loader, Card } from "@plane/ui";
// ce imports
import { ProgressTrackingBadge } from "@/plane-web/components/issues/issue-layouts/progress-tracking-badge";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// services
import { UserService } from "@/services/user.service";
import { ProjectService, ProjectStateService } from "@/services/project";

const userService = new UserService();
const projectService = new ProjectService();
const stateService = new ProjectStateService();

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

type ProjectLookup = { name: string; identifier: string };
type StateLookup = { name: string; color: string; group: string };

type EnrichedIssue = TBaseIssue & {
  _workspaceSlug: string;
  _workspaceName: string;
  _project?: ProjectLookup;
  _state?: StateLookup;
};

const EXCLUDED_STATE_GROUPS = new Set(["completed", "cancelled"]);

export const TodayWorkItems = observer(function TodayWorkItems() {
  const { workspaceSlug, userId } = useParams();
  const { t } = useTranslation();
  const { workspaces } = useWorkspace();

  const [crossWorkspaces, setCrossWorkspaces] = useState(true);
  const todayStr = new Date().toISOString().split("T")[0];

  const allWorkspaceSlugs = useMemo(() => Object.values(workspaces ?? {}).map((ws) => ws.slug), [workspaces]);

  const workspaceSlugsToFetch = crossWorkspaces ? allWorkspaceSlugs : workspaceSlug ? [workspaceSlug.toString()] : [];
  const swrKey =
    workspaceSlugsToFetch.length > 0 && userId
      ? `TODAY_ISSUES_${crossWorkspaces ? "ALL" : workspaceSlug}_${userId}`
      : null;

  const { data: mergedIssues, isLoading } = useSWR(swrKey, async () => {
    if (!userId) return [];
    const uid = userId.toString();
    const filterParams = {
      assignees: uid,
      state_group: "backlog,unstarted,started",
      start_date: `${todayStr};before_including;`,
      order_by: "target_date",
    };

    const results = await Promise.all(
      workspaceSlugsToFetch.map(async (slug) => {
        try {
          const ws = Object.values(workspaces ?? {}).find((w) => w.slug === slug);

          // Fetch issues, projects, and states in parallel for each workspace
          const [issuesResponse, projects, states] = await Promise.all([
            userService.getUserProfileIssues(slug.toString(), uid, filterParams),
            projectService.getProjectsLite(slug.toString()).catch(() => []),
            stateService.getWorkspaceStates(slug.toString()).catch(() => []),
          ]);

          // Build lookup maps
          const projectMap = new Map<string, ProjectLookup>();
          for (const p of projects) {
            projectMap.set(p.id, { name: p.name, identifier: p.identifier });
          }

          const stateMap = new Map<string, StateLookup>();
          for (const s of states as IState[]) {
            stateMap.set(s.id, { name: s.name, color: s.color, group: s.group });
          }

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

  const issueList = useMemo(
    () =>
      (mergedIssues ?? []).filter((issue) => {
        if (!issue._state) return true;
        return !EXCLUDED_STATE_GROUPS.has(issue._state.group);
      }),
    [mergedIssues]
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
      <Card>
        {isDataReady ? (
          issueList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-13">
                <thead>
                  <tr className="border-b border-subtle text-secondary">
                    <th className="pb-3 pl-4 pr-4 font-medium whitespace-nowrap">
                      {t("profile.stats.today_work_items.columns.work_item")}
                    </th>
                    <th className="pb-3 pr-4 font-medium whitespace-nowrap">
                      {t("profile.stats.today_work_items.columns.department")}
                    </th>
                    <th className="pb-3 pr-4 font-medium whitespace-nowrap">
                      {t("profile.stats.today_work_items.columns.project")}
                    </th>
                    <th className="pb-3 pr-4 font-medium whitespace-nowrap">
                      {t("profile.stats.today_work_items.columns.state")}
                    </th>
                    <th className="pb-3 pr-4 font-medium whitespace-nowrap">
                      {t("profile.stats.today_work_items.columns.progress")}
                    </th>
                    <th className="pb-3 pr-4 font-medium whitespace-nowrap">
                      {t("profile.stats.today_work_items.columns.start_date")}
                    </th>
                    <th className="pb-3 pr-4 font-medium whitespace-nowrap">
                      {t("profile.stats.today_work_items.columns.due_date")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {issueList.map((issue: EnrichedIssue) => {
                    const project = issue._project;
                    const state = issue._state;
                    const detailHref = `/${issue._workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`;

                    return (
                      <tr
                        key={`${issue._workspaceSlug}-${issue.id}`}
                        className="border-b border-subtle last:border-b-0 hover:bg-surface-2 transition-colors"
                      >
                        <td className="py-2.5 pl-4 pr-4">
                          <Link
                            href={detailHref}
                            className="group flex items-center gap-2 hover:underline max-w-[280px] lg:max-w-[360px]"
                          >
                            <span className="flex-shrink-0 text-secondary text-12">
                              {project?.identifier ? `${project.identifier}-${issue.sequence_id}` : issue.sequence_id}
                            </span>
                            <span className="truncate text-primary font-medium">{issue.name}</span>
                          </Link>
                        </td>
                        <td className="py-2.5 pr-4 text-secondary truncate max-w-[150px]">
                          {issue._workspaceName}
                        </td>
                        <td className="py-2.5 pr-4 text-secondary truncate max-w-[150px]">
                          {project?.name ?? "—"}
                        </td>
                        <td className="py-2.5 pr-4">
                          {state ? (
                            <span className="inline-flex items-center gap-2 text-12 text-primary">
                              <span
                                className="h-2 w-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: state.color }}
                              />
                              <span className="truncate max-w-[120px]">{state.name}</span>
                            </span>
                          ) : (
                            <span className="text-secondary">—</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4">
                          <ProgressTrackingBadge targetDate={issue.target_date} />
                        </td>
                        <td className="py-2.5 pr-4 text-secondary text-12 whitespace-nowrap">
                          {formatDate(issue.start_date)}
                        </td>
                        <td className="py-2.5 pr-4 text-secondary text-12 whitespace-nowrap">
                          {formatDate(issue.target_date)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyStateCompact
              title={t("profile.stats.today_work_items.empty")}
              assetKey="unknown"
              assetClassName="size-20"
            />
          )
        ) : (
          <Loader className="space-y-5">
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
          </Loader>
        )}
      </Card>
    </div>
  );
});
