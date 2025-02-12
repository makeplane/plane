"use client";
import { useParams } from "next/navigation";
import useSWR from "swr";
// ui
import { useTranslation } from "@plane/i18n";
import { Button, ContentWrapper, Loader } from "@plane/ui";
// components
import { AnalyticsDemand, AnalyticsLeaderBoard, AnalyticsScope, AnalyticsYearWiseIssues } from "@/components/analytics";
// fetch-keys
import { DEFAULT_ANALYTICS } from "@/constants/fetch-keys";
// services
import { AnalyticsService } from "@/services/analytics.service";

type Props = {
  fullScreen?: boolean;
};

// services
const analyticsService = new AnalyticsService();

export const ScopeAndDemand: React.FC<Props> = (props) => {
  const { fullScreen = true } = props;

  const { workspaceSlug, projectId, cycleId, moduleId } = useParams();
  const { t } = useTranslation();

  const isProjectLevel = projectId ? true : false;

  const params = isProjectLevel
    ? {
        project: projectId ? [projectId.toString()] : null,
        cycle: cycleId ? cycleId.toString() : null,
        module: moduleId ? moduleId.toString() : null,
      }
    : undefined;

  const {
    data: defaultAnalytics,
    error: defaultAnalyticsError,
    mutate: mutateDefaultAnalytics,
  } = useSWR(
    workspaceSlug ? DEFAULT_ANALYTICS(workspaceSlug.toString(), params) : null,
    workspaceSlug ? () => analyticsService.getDefaultAnalytics(workspaceSlug.toString(), params) : null
  );

  // scope data
  const pendingIssues = defaultAnalytics?.pending_issue_user ?? [];
  const pendingUnAssignedIssuesUser = pendingIssues?.find((issue) => issue.assignees__id === null);
  const pendingAssignedIssues = pendingIssues?.filter((issue) => issue.assignees__id !== null);

  return (
    <>
      {!defaultAnalyticsError ? (
        defaultAnalytics ? (
          <ContentWrapper>
            <div className={`grid grid-cols-1 gap-5 ${fullScreen ? "md:grid-cols-2" : ""}`}>
              <AnalyticsDemand defaultAnalytics={defaultAnalytics} />
              <AnalyticsScope
                pendingUnAssignedIssuesUser={pendingUnAssignedIssuesUser}
                pendingAssignedIssues={pendingAssignedIssues}
              />
              <AnalyticsLeaderBoard
                users={defaultAnalytics.most_issue_created_user?.map((user) => ({
                  avatar_url: user?.created_by__avatar_url,
                  firstName: user?.created_by__first_name,
                  lastName: user?.created_by__last_name,
                  display_name: user?.created_by__display_name,
                  count: user?.count,
                  id: user?.created_by__id,
                }))}
                title={t("workspace_analytics.most_work_items_created.title")}
                emptyStateMessage={t("workspace_analytics.most_work_items_created.empty_state")}
                workspaceSlug={workspaceSlug?.toString() ?? ""}
              />
              <AnalyticsLeaderBoard
                users={defaultAnalytics.most_issue_closed_user?.map((user) => ({
                  avatar_url: user?.assignees__avatar_url,
                  firstName: user?.assignees__first_name,
                  lastName: user?.assignees__last_name,
                  display_name: user?.assignees__display_name,
                  count: user?.count,
                  id: user?.assignees__id,
                }))}
                title={t("workspace_analytics.most_work_items_closed.title")}
                emptyStateMessage={t("workspace_analytics.most_work_items_closed.empty_state")}
                workspaceSlug={workspaceSlug?.toString() ?? ""}
              />
              <div className={fullScreen ? "md:col-span-2" : ""}>
                <AnalyticsYearWiseIssues defaultAnalytics={defaultAnalytics} />
              </div>
            </div>
          </ContentWrapper>
        ) : (
          <Loader className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-2">
            <Loader.Item height="250px" />
            <Loader.Item height="250px" />
            <Loader.Item height="250px" />
            <Loader.Item height="250px" />
          </Loader>
        )
      ) : (
        <div className="grid h-full place-items-center p-5">
          <div className="space-y-4 text-custom-text-200">
            <p className="text-sm">{t("workspace_analytics.error")}</p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="primary" onClick={() => mutateDefaultAnalytics()}>
                {t("refresh")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
