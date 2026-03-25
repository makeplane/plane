"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TBaseIssue } from "@plane/types";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { Loader, Card } from "@plane/ui";
// ce imports
import { ProgressTrackingBadge } from "@/plane-web/components/issues/issue-layouts/progress-tracking-badge";
// constants
import { USER_PROFILE_TODAY_ISSUES } from "@/constants/fetch-keys";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useWorkspace } from "@/hooks/store/use-workspace";
// services
import { UserService } from "@/services/user.service";

const userService = new UserService();

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export const TodayWorkItems = observer(function TodayWorkItems() {
  const { workspaceSlug, userId } = useParams();
  const { t } = useTranslation();
  const { getProjectById } = useProject();
  const { getStateById } = useProjectState();
  const { currentWorkspace } = useWorkspace();

  const todayStr = new Date().toISOString().split("T")[0];

  const { data: todayIssuesResponse } = useSWR(
    workspaceSlug && userId ? USER_PROFILE_TODAY_ISSUES(workspaceSlug.toString(), userId.toString()) : null,
    workspaceSlug && userId
      ? () =>
          userService.getUserProfileIssues(workspaceSlug.toString(), userId.toString(), {
            assignees: userId.toString(),
            state_group: "backlog,unstarted,started",
            start_date: `${todayStr};before_including;`,
            order_by: "target_date",
          })
      : null
  );

  const EXCLUDED_STATE_GROUPS = new Set(["completed", "cancelled"]);
  const issues = todayIssuesResponse?.results;
  const issueList = (Array.isArray(issues) ? (issues as TBaseIssue[]) : []).filter((issue) => {
    if (!issue.state_id) return true;
    const state = getStateById(issue.state_id);
    return !state || !EXCLUDED_STATE_GROUPS.has(state.group);
  });
  const departmentName = currentWorkspace?.name ?? "—";

  return (
    <div className="space-y-2">
      <h3 className="text-16 font-medium">{t("profile.stats.today_work_items.title")}</h3>
      <Card>
        {todayIssuesResponse ? (
          issueList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-13">
                <thead>
                  <tr className="border-b border-border-subtle text-secondary">
                    <th className="pb-2 pr-4 font-medium">{t("profile.stats.today_work_items.columns.work_item")}</th>
                    <th className="pb-2 pr-4 font-medium">{t("profile.stats.today_work_items.columns.department")}</th>
                    <th className="pb-2 pr-4 font-medium">{t("profile.stats.today_work_items.columns.project")}</th>
                    <th className="pb-2 pr-4 font-medium">{t("profile.stats.today_work_items.columns.state")}</th>
                    <th className="pb-2 pr-4 font-medium">{t("profile.stats.today_work_items.columns.progress")}</th>
                    <th className="pb-2 pr-4 font-medium">{t("profile.stats.today_work_items.columns.start_date")}</th>
                    <th className="pb-2 font-medium">{t("profile.stats.today_work_items.columns.due_date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {issueList.map((issue) => {
                    const project = getProjectById(issue.project_id);
                    const state = issue.state_id ? getStateById(issue.state_id) : undefined;

                    return (
                      <tr key={issue.id} className="border-b border-border-subtle last:border-b-0">
                        <td className="py-2.5 pr-4">
                          <span className="text-secondary text-12">
                            {project?.identifier}-{issue.sequence_id}
                          </span>{" "}
                          <span className="text-primary">{issue.name}</span>
                        </td>
                        <td className="py-2.5 pr-4 text-secondary">{departmentName}</td>
                        <td className="py-2.5 pr-4 text-secondary">{project?.name ?? "—"}</td>
                        <td className="py-2.5 pr-4">
                          {state ? (
                            <span className="inline-flex items-center gap-1.5 text-12" style={{ color: state.color }}>
                              <span
                                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: state.color }}
                              />
                              {state.name}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2.5 pr-4">
                          <ProgressTrackingBadge targetDate={issue.target_date} />
                        </td>
                        <td className="py-2.5 pr-4 text-secondary text-12">{formatDate(issue.start_date)}</td>
                        <td className="py-2.5 text-secondary text-12">{formatDate(issue.target_date)}</td>
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
