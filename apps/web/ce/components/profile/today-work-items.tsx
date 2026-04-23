"use client";

import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TBaseIssue, IState } from "@plane/types";
import { cn } from "@plane/utils";
import { Switch } from "@plane/propel/switch";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { Loader, Card } from "@plane/ui";
// ce imports
import { ProgressTrackingBadge } from "@/plane-web/components/issues/issue-layouts/progress-tracking-badge";
import { exportWorkItemsXLSX } from "./export-work-items";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useWorkspace } from "@/hooks/store/use-workspace";
// services
import { UserService } from "@/services/user.service";
import { ProjectService, ProjectStateService } from "@/services/project";

const userService = new UserService();
const projectService = new ProjectService();
const stateService = new ProjectStateService();

const PAGE_SIZE = 10;

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
  const { setPeekIssue } = useIssueDetail();

  const [crossWorkspaces, setCrossWorkspaces] = useState(true);
  const [page, setPage] = useState(1);

  const todayStr = new Date().toISOString().split("T")[0];

  // Compute directly — NOT useMemo. MobX observable map mutates in-place,
  // so the reference never changes and useMemo would return a stale [].
  const allWorkspaceSlugs = Object.values(workspaces ?? {}).map((ws) => ws.slug);
  const workspaceSlugsToFetch = crossWorkspaces ? allWorkspaceSlugs : workspaceSlug ? [workspaceSlug.toString()] : [];

  // Include sorted slugs + todayStr in key so SWR re-fetches on workspace load or day change
  const sortedSlugs = [...workspaceSlugsToFetch].sort().join(",");
  const swrKey = sortedSlugs.length > 0 && userId ? `TODAY_ISSUES_${sortedSlugs}_${userId}_${todayStr}` : null;

  const { data: mergedIssues, isLoading } = useSWR(swrKey, async () => {
    if (!userId) return [];
    const uid = userId.toString();

    // NOTE: start_date filter REMOVED intentionally.
    // The `start_date;before_including;` format causes a 500 on the backend.
    // We instead filter by start_date on the frontend below.
    const filterParams = {
      assignees: uid,
      state_group: "backlog,unstarted,started",
      order_by: "target_date",
    };

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

  const issueList = (mergedIssues ?? []).filter((issue) => {
    // Exclude completed/cancelled states
    if (issue._state && EXCLUDED_STATE_GROUPS.has(issue._state.group)) return false;
    // Exclude items whose start_date is in the future (null start_date = always included)
    if (issue.start_date && issue.start_date > todayStr) return false;
    return true;
  });

  // Reset to page 1 whenever the filtered list changes
  useEffect(() => {
    setPage(1);
  }, [issueList.length]);

  const totalPages = Math.max(1, Math.ceil(issueList.length / PAGE_SIZE));
  const paginatedIssues = issueList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const isDataReady = !isLoading && mergedIssues !== undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-16 font-medium">{t("profile.stats.today_work_items.title")}</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-13 text-secondary">{t("profile.stats.today_work_items.cross_workspaces")}</span>
            <Switch value={crossWorkspaces} onChange={setCrossWorkspaces} size="sm" />
          </div>
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
      <Card>
        {isDataReady ? (
          issueList.length > 0 ? (
            <div className="space-y-3">
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
                    {paginatedIssues.map((issue: EnrichedIssue) => {
                      const project = issue._project;
                      const state = issue._state;

                      return (
                        <tr
                          key={`${issue._workspaceSlug}-${issue.id}`}
                          className="border-b border-subtle last:border-b-0 hover:bg-surface-2 transition-colors"
                        >
                          <td className="py-2.5 pl-4 pr-4">
                            <button
                              type="button"
                              onClick={() =>
                                issue.project_id &&
                                issue.id &&
                                setPeekIssue({
                                  workspaceSlug: issue._workspaceSlug,
                                  projectId: issue.project_id,
                                  issueId: issue.id,
                                })
                              }
                              className="group flex items-center gap-2 hover:underline max-w-[280px] lg:max-w-[360px] text-left"
                            >
                              <span className="flex-shrink-0 text-secondary text-12">
                                {project?.identifier ? `${project.identifier}-${issue.sequence_id}` : issue.sequence_id}
                              </span>
                              <span className="truncate text-primary font-medium">{issue.name}</span>
                            </button>
                          </td>
                          <td className="py-2.5 pr-4 text-secondary truncate max-w-[150px]">{issue._workspaceName}</td>
                          <td className="py-2.5 pr-4 text-secondary truncate max-w-[150px]">{project?.name ?? "—"}</td>
                          <td className="py-2.5 pr-4">
                            {state ? (
                              <span
                                className="inline-flex h-5 items-center rounded-sm border-[0.5px] px-2 text-caption-sm-regular truncate max-w-[140px]"
                                style={{
                                  color: state.color,
                                  backgroundColor: `${state.color}1A`,
                                  borderColor: `${state.color}4D`,
                                }}
                              >
                                {state.name}
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
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 pb-3 text-13 text-secondary">
                  <span>
                    {t("profile.stats.today_work_items.pagination.showing", {
                      from: (page - 1) * PAGE_SIZE + 1,
                      to: Math.min(page * PAGE_SIZE, issueList.length),
                      total: issueList.length,
                    })}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className={cn(
                        "p-1 rounded hover:bg-surface-2 transition-colors",
                        page === 1 && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={cn(
                          "min-w-[28px] h-7 px-1.5 rounded text-12 transition-colors",
                          p === page ? "bg-custom-primary-100 text-white font-medium" : "hover:bg-surface-2"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className={cn(
                        "p-1 rounded hover:bg-surface-2 transition-colors",
                        page === totalPages && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
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
