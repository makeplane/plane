import { useRouter } from "next/router";

import useSWR from "swr";

// services
// components
import { Button, Loader } from "@plane/ui";
import { AnalyticsDemand, AnalyticsLeaderBoard, AnalyticsScope, AnalyticsYearWiseIssues } from "@/components/analytics";
// ui
// fetch-keys
import { DEFAULT_ANALYTICS } from "@/constants/fetch-keys";
import { AnalyticsService } from "@/services/analytics.service";

type Props = {
  fullScreen?: boolean;
};

// services
const analyticsService = new AnalyticsService();

export const ScopeAndDemand: React.FC<Props> = (props) => {
  const { fullScreen = true } = props;

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

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
          <div className="h-full overflow-y-auto p-5 text-sm vertical-scrollbar scrollbar-lg">
            <div className={`grid grid-cols-1 gap-5 ${fullScreen ? "md:grid-cols-2" : ""}`}>
              <AnalyticsDemand defaultAnalytics={defaultAnalytics} />
              <AnalyticsScope
                pendingUnAssignedIssuesUser={pendingUnAssignedIssuesUser}
                pendingAssignedIssues={pendingAssignedIssues}
              />
              <AnalyticsLeaderBoard
                users={defaultAnalytics.most_issue_created_user?.map((user) => ({
                  avatar: user?.created_by__avatar,
                  firstName: user?.created_by__first_name,
                  lastName: user?.created_by__last_name,
                  display_name: user?.created_by__display_name,
                  count: user?.count,
                  id: user?.created_by__id,
                }))}
                title="Most issues created"
                emptyStateMessage="Co-workers and the number of issues created by them appears here."
                workspaceSlug={workspaceSlug?.toString() ?? ""}
              />
              <AnalyticsLeaderBoard
                users={defaultAnalytics.most_issue_closed_user?.map((user) => ({
                  avatar: user?.assignees__avatar,
                  firstName: user?.assignees__first_name,
                  lastName: user?.assignees__last_name,
                  display_name: user?.assignees__display_name,
                  count: user?.count,
                  id: user?.assignees__id,
                }))}
                title="Most issues closed"
                emptyStateMessage="Co-workers and the number of issues closed by them appears here."
                workspaceSlug={workspaceSlug?.toString() ?? ""}
              />
              <div className={fullScreen ? "md:col-span-2" : ""}>
                <AnalyticsYearWiseIssues defaultAnalytics={defaultAnalytics} />
              </div>
            </div>
          </div>
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
            <p className="text-sm">There was some error in fetching the data.</p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="primary" onClick={() => mutateDefaultAnalytics()}>
                Refresh
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
